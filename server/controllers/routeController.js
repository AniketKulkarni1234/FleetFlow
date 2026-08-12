// server/controllers/routeController.js
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");

// City distance matrix (km) — Indian cities for realistic demo data
const CITY_DISTANCES = {
  "Mumbai-Delhi": 1400,
  "Mumbai-Bangalore": 980,
  "Mumbai-Chennai": 1330,
  "Mumbai-Kolkata": 2050,
  "Mumbai-Hyderabad": 710,
  "Mumbai-Pune": 150,
  "Mumbai-Ahmedabad": 530,
  "Mumbai-Jaipur": 1150,
  "Mumbai-Lucknow": 1350,
  "Mumbai-Nagpur": 840,
  "Delhi-Bangalore": 2150,
  "Delhi-Chennai": 2180,
  "Delhi-Kolkata": 1530,
  "Delhi-Hyderabad": 1550,
  "Delhi-Pune": 1450,
  "Delhi-Ahmedabad": 940,
  "Delhi-Jaipur": 280,
  "Delhi-Lucknow": 550,
  "Delhi-Nagpur": 1080,
  "Bangalore-Chennai": 350,
  "Bangalore-Kolkata": 1870,
  "Bangalore-Hyderabad": 570,
  "Bangalore-Pune": 840,
  "Bangalore-Ahmedabad": 1500,
  "Chennai-Kolkata": 1660,
  "Chennai-Hyderabad": 630,
  "Kolkata-Hyderabad": 1490,
  "Pune-Hyderabad": 560,
  "Pune-Nagpur": 710,
  "Ahmedabad-Jaipur": 670,
  "Lucknow-Kolkata": 990,
  "Jaipur-Lucknow": 580,
};

// Average fuel consumption rates (L/100km) by vehicle type
const AVG_FUEL_RATE = 25; // liters per 100km for heavy trucks
const FUEL_PRICE_PER_LITER = 95; // ₹ per liter (diesel)
const AVG_SPEED_KMH = 55; // Average speed for trucks in India

/**
 * Look up distance between two cities (order-agnostic)
 */
const getDistance = (origin, destination) => {
  const key1 = `${origin}-${destination}`;
  const key2 = `${destination}-${origin}`;
  return CITY_DISTANCES[key1] || CITY_DISTANCES[key2] || null;
};

/**
 * POST /api/routes/estimate
 * Estimate distance, fuel cost, and duration for a route
 */
exports.estimateRoute = async (req, res) => {
  try {
    const { origin, destination, cargoWeight } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ msg: "Origin and destination are required" });
    }

    const originClean = origin.trim();
    const destClean = destination.trim();

    let estimatedDistance = getDistance(originClean, destClean);
    
    // If not in our known matrix, use a rough estimate based on name hashing
    if (!estimatedDistance) {
      // Generate a semi-deterministic distance between 100-2000km
      const hash = (originClean.length + destClean.length) * 47 + originClean.charCodeAt(0) * 13;
      estimatedDistance = 100 + (hash % 1900);
    }

    const estimatedFuelLiters = (estimatedDistance * AVG_FUEL_RATE) / 100;
    const estimatedFuelCost = Math.round(estimatedFuelLiters * FUEL_PRICE_PER_LITER);
    const estimatedDurationHours = (estimatedDistance / AVG_SPEED_KMH).toFixed(1);

    // Load factor adjustment — heavier loads use more fuel
    const loadFactor = cargoWeight ? 1 + (Number(cargoWeight) / 50000) * 0.15 : 1;
    const adjustedFuelCost = Math.round(estimatedFuelCost * loadFactor);

    res.json({
      origin: originClean,
      destination: destClean,
      estimatedDistance,
      estimatedFuelLiters: Math.round(estimatedFuelLiters * loadFactor),
      estimatedFuelCost: adjustedFuelCost,
      estimatedDurationHours: parseFloat(estimatedDurationHours),
      loadFactor: parseFloat(loadFactor.toFixed(2)),
    });
  } catch (err) {
    console.error("Route Estimation Error:", err);
    res.status(500).json({ msg: "Failed to estimate route" });
  }
};

/**
 * POST /api/routes/suggest-vehicle
 * Suggest the most cost-effective vehicle for a given cargo weight
 */
exports.suggestVehicle = async (req, res) => {
  try {
    const { cargoWeight, estimatedDistance } = req.body;

    if (!cargoWeight) {
      return res.status(400).json({ msg: "Cargo weight is required" });
    }

    const weight = Number(cargoWeight);
    const dist = Number(estimatedDistance) || 500;

    // Find available vehicles that can carry the weight
    const candidates = await Vehicle.find({
      status: "AVAILABLE",
      maxCapacity: { $gte: weight },
    }).sort({ maxCapacity: 1 }); // Smallest sufficient vehicle first

    if (candidates.length === 0) {
      return res.status(404).json({ msg: "No available vehicles can carry this weight" });
    }

    // Score each vehicle — prefer smallest sufficient capacity (fuel efficiency)
    const scored = candidates.map((v) => {
      const utilizationPercent = Math.round((weight / v.maxCapacity) * 100);
      const fuelEstimate = Math.round((dist * AVG_FUEL_RATE) / 100 * FUEL_PRICE_PER_LITER);
      // Lower capacity ratio = better match
      const efficiencyScore = utilizationPercent;

      return {
        vehicle: v,
        utilizationPercent,
        estimatedFuelCost: fuelEstimate,
        efficiencyScore,
      };
    });

    // Sort by highest utilization (best fit)
    scored.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    res.json({
      recommended: scored[0],
      alternatives: scored.slice(1, 4),
    });
  } catch (err) {
    console.error("Vehicle Suggestion Error:", err);
    res.status(500).json({ msg: "Failed to suggest vehicle" });
  }
};

/**
 * GET /api/routes/history
 * Get route history grouped by origin-destination pairs
 */
exports.getRouteHistory = async (req, res) => {
  try {
    const routeHistory = await Trip.aggregate([
      {
        $match: {
          origin: { $exists: true, $ne: "" },
          destination: { $exists: true, $ne: "" },
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: { origin: "$origin", destination: "$destination" },
          totalTrips: { $sum: 1 },
          avgDistance: { $avg: "$distance" },
          avgFuelUsed: { $avg: "$fuelUsed" },
          totalRevenue: { $sum: "$revenue" },
          lastTrip: { $max: "$createdAt" },
        },
      },
      { $sort: { totalTrips: -1 } },
      { $limit: 20 },
    ]);

    res.json(routeHistory);
  } catch (err) {
    console.error("Route History Error:", err);
    res.status(500).json({ msg: "Failed to fetch route history" });
  }
};

/**
 * GET /api/routes/cities
 * Return available city names for autocomplete
 */
exports.getCities = async (req, res) => {
  const cities = [...new Set(
    Object.keys(CITY_DISTANCES).flatMap(key => key.split("-"))
  )].sort();
  res.json(cities);
};
