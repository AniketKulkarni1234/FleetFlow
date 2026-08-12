// server/controllers/fuelController.js
const FuelEntry = require("../models/FuelEntry");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

// Create Fuel Entry
exports.createFuelEntry = async (req, res) => {
  try {
    const { vehicleId, driverId, liters, costPerLiter, odometerReading, fuelStation, billUrl, date } = req.body;

    if (!vehicleId || !liters || !costPerLiter || !odometerReading) {
      return res.status(400).json({ msg: "Vehicle, liters, cost per liter, and odometer reading are required" });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ msg: "Vehicle not found" });

    // Validate odometer reading is logical (greater than or equal to current odometer)
    if (Number(odometerReading) < vehicle.odometer) {
      return res.status(400).json({ 
        msg: `Invalid odometer reading: current is ${vehicle.odometer} km. Odometer Cannot roll backwards.`
      });
    }

    // Auto-update vehicle odometer to this reading
    const oldOdometer = vehicle.odometer;
    vehicle.odometer = Number(odometerReading);
    await vehicle.save();

    const totalCost = Number(liters) * Number(costPerLiter);

    const fuelEntry = await FuelEntry.create({
      vehicle: vehicleId,
      driver: driverId || null,
      liters: Number(liters),
      costPerLiter: Number(costPerLiter),
      totalCost,
      odometerReading: Number(odometerReading),
      fuelStation: fuelStation ? fuelStation.trim() : "",
      billUrl: billUrl || "",
      date: date ? new Date(date) : new Date(),
    });

    // Also register an standard expense transaction for fuel so it flows to financial reports
    const Expense = require("../models/Expense");
    await Expense.create({
      vehicle: vehicleId,
      liters: Number(liters),
      cost: totalCost,
      date: date ? new Date(date) : new Date(),
      type: "FUEL"
    });

    const populated = await FuelEntry.findById(fuelEntry._id).populate("vehicle driver");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create fuel entry error:", err);
    res.status(500).json({ msg: "Server error creation failed" });
  }
};

// Get all fuel entries
exports.getFuelEntries = async (req, res) => {
  try {
    const entries = await FuelEntry.find()
      .populate("vehicle driver")
      .sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to load fuel entries" });
  }
};

// Calculate mileage and fuel cost metrics
exports.getFuelAnalytics = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    const analytics = await Promise.all(vehicles.map(async (v) => {
      const entries = await FuelEntry.find({ vehicle: v._id }).sort({ odometerReading: 1 });

      let mileage = 0;
      let totalLiters = 0;
      let totalCost = 0;
      
      if (entries.length > 0) {
        totalCost = entries.reduce((acc, e) => acc + e.totalCost, 0);
        totalLiters = entries.reduce((acc, e) => acc + e.liters, 0);

        if (entries.length > 1) {
          const firstOdo = entries[0].odometerReading;
          const lastOdo = entries[entries.length - 1].odometerReading;
          const totalDistance = lastOdo - firstOdo;
          // Exclude first fill-up liters for exact mileage calculations
          const consumdLiters = totalLiters - entries[0].liters;
          mileage = consumdLiters > 0 ? parseFloat((totalDistance / consumdLiters).toFixed(2)) : 0;
        } else {
          // Estimated baseline mileage based on vehicle odometer distance
          mileage = totalLiters > 0 ? parseFloat((v.odometer / totalLiters).toFixed(2)) : 5.8;
        }
      }

      return {
        vehicleId: v._id,
        name: v.name,
        licensePlate: v.licensePlate,
        currentOdometer: v.odometer,
        totalRefuelCount: entries.length,
        totalLiters,
        totalCost,
        mileage: mileage || 5.5, // fallback baseline km/L
        fuelCostPerKm: mileage > 0 ? parseFloat(( (totalCost / totalLiters) / mileage ).toFixed(2)) : 0
      };
    }));

    res.json(analytics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to generate fuel analytics" });
  }
};
