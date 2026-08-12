// server/controllers/searchController.js
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");

/**
 * GET /api/search
 * Global Smart Search with filters, pagination, and sorting for:
 * Vehicles, Drivers, Trips / Shipments
 */
exports.globalSearch = async (req, res) => {
  try {
    const { q = "", type = "All", page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.max(1, parseInt(limit));
    const skip = (parsedPage - 1) * parsedLimit;
    const sortParams = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const searchRegex = new RegExp(q, "i");
    const results = [];
    let vehiclesCount = 0;
    let driversCount = 0;
    let tripsCount = 0;

    // 1. VEHICLES QUERY
    if (type === "All" || type === "Vehicle") {
      const vQuery = {
        $or: [
          { name: searchRegex },
          { licensePlate: searchRegex }
        ]
      };
      
      // Apply filters if provided
      if (req.query.vehicleStatus) {
        vQuery.status = req.query.vehicleStatus;
      }

      vehiclesCount = await Vehicle.countDocuments(vQuery);
      const vehicles = await Vehicle.find(vQuery)
        .sort(sortParams)
        .skip(type === "All" ? 3 : skip) // Limit preview size in global view
        .limit(type === "All" ? 3 : parsedLimit);

      vehicles.forEach(v => {
        results.push({
          id: v._id,
          type: "Vehicle",
          title: v.name,
          subtitle: v.licensePlate,
          status: v.status,
          details: `Capacity: ${v.maxCapacity} kg | ODO: ${v.odometer} km`,
          payload: v
        });
      });
    }

    // 2. DRIVERS QUERY
    if (type === "All" || type === "Driver") {
      const dQuery = {
        $or: [
          { name: searchRegex },
          { licenseNumber: searchRegex }
        ]
      };

      if (req.query.driverStatus) {
        dQuery.status = req.query.driverStatus;
      }

      driversCount = await Driver.countDocuments(dQuery);
      const drivers = await Driver.find(dQuery)
        .sort(sortParams)
        .skip(type === "All" ? 3 : skip)
        .limit(type === "All" ? 3 : parsedLimit);

      drivers.forEach(d => {
        results.push({
          id: d._id,
          type: "Driver",
          title: d.name,
          subtitle: `Lic: ${d.licenseNumber}`,
          status: d.status,
          details: `Safety: ${d.safetyScore}% | Trips: ${d.totalTrips}`,
          payload: d
        });
      });
    }

    // 3. TRIPS / SHIPMENTS QUERY
    if (type === "All" || type === "Trip" || type === "Shipment") {
      const tQuery = {
        $or: [
          { origin: searchRegex },
          { destination: searchRegex },
          { notes: searchRegex }
        ]
      };

      if (req.query.tripStatus) {
        tQuery.status = req.query.tripStatus;
      }

      tripsCount = await Trip.countDocuments(tQuery);
      const trips = await Trip.find(tQuery)
        .populate("vehicle driver")
        .sort(sortParams)
        .skip(type === "All" ? 3 : skip)
        .limit(type === "All" ? 3 : parsedLimit);

      trips.forEach(t => {
        results.push({
          id: t._id,
          type: "Trip",
          title: `Trip TRP-${t._id.toString().slice(-6).toUpperCase()}`,
          subtitle: `${t.origin || "Origin"} ➔ ${t.destination || "Destination"}`,
          status: t.status,
          details: `Cargo: ${t.cargoWeight} kg | Vehicle: ${t.vehicle?.name || "None"} | Driver: ${t.driver?.name || "None"}`,
          payload: t
        });
      });
    }

    const grandTotal = vehiclesCount + driversCount + tripsCount;
    let selectedTotal = grandTotal;
    if (type === "Vehicle") selectedTotal = vehiclesCount;
    if (type === "Driver") selectedTotal = driversCount;
    if (type === "Trip" || type === "Shipment") selectedTotal = tripsCount;

    res.json({
      query: q,
      searchResults: results,
      totalCount: selectedTotal,
      page: parsedPage,
      totalPages: Math.ceil(selectedTotal / parsedLimit),
      breakdown: {
        vehicles: vehiclesCount,
        drivers: driversCount,
        trips: tripsCount
      }
    });

  } catch (err) {
    console.error("Global smart search failed:", err);
    res.status(500).json({ msg: "Search server error" });
  }
};
