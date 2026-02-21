// server/controllers/analyticsController.js
const Vehicle = require("../models/Vehicle");
const Expense = require("../models/Expense");
const Trip = require("../models/Trip");

exports.calculateFuelEfficiency = async (req, res) => {
  try {
    const trips = await Trip.find();
    const totalDistance = trips.reduce((acc, t) => acc + (t.distance || 0), 0);
    const totalFuel = trips.reduce((acc, t) => acc + (t.fuelUsed || 0), 0);
    const efficiency = totalFuel ? (totalDistance / totalFuel).toFixed(2) : 0;
    res.json({ fuelEfficiency: efficiency });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.calculateVehicleROI = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    const result = [];
    for (const v of vehicles) {
      const expenses = await Expense.find({ vehicle: v._id });
      const totalCost = expenses.reduce((acc, e) => acc + e.cost, 0) + (v.acquisitionCost || 0);
      const revenue = v.revenue || 0;
      const roi = totalCost ? ((revenue - totalCost) / (v.acquisitionCost || 1)).toFixed(2) : 0;
      result.push({ vehicle: v.name, ROI: roi });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};