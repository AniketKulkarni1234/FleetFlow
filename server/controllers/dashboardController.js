// server/controllers/dashboardController.js
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const Driver = require("../models/Driver");
const Expense = require("../models/Expense");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeFleet = await Vehicle.countDocuments({ status: "ON_TRIP" });
    const maintenanceAlerts = await Vehicle.countDocuments({ status: "IN_SHOP" });
    const availableVehicles = await Vehicle.countDocuments({ status: "AVAILABLE" });
    const utilizationRate = totalVehicles ? Math.round((activeFleet / totalVehicles) * 100) : 0;

    const totalDrivers = await Driver.countDocuments();
    const availableDrivers = await Driver.countDocuments({ status: "AVAILABLE" });
    const suspendedDrivers = await Driver.countDocuments({ status: "SUSPENDED" });

    const totalTrips = await Trip.countDocuments();
    const completedTrips = await Trip.countDocuments({ status: "COMPLETED" });
    const activeTrips = await Trip.countDocuments({ status: { $in: ["DRAFT", "DISPATCHED"] } });

    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((acc, e) => acc + e.cost, 0);

    // Recent 5 trips
    const recentTrips = await Trip.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("vehicle driver");

    // Drivers with license expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringLicenses = await Driver.countDocuments({
      licenseExpiry: { $lte: thirtyDaysFromNow },
      status: { $ne: "SUSPENDED" },
    });

    res.json({
      totalVehicles,
      activeFleet,
      maintenanceAlerts,
      availableVehicles,
      utilizationRate,
      totalDrivers,
      availableDrivers,
      suspendedDrivers,
      totalTrips,
      completedTrips,
      activeTrips,
      totalExpenses,
      recentTrips,
      expiringLicenses,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};