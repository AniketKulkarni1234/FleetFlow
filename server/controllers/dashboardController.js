// server/controllers/dashboardController.js
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Expense = require("../models/Expense");
const Maintenance = require("../models/Maintenance");

exports.getStats = async (req, res) => {
  try {
    const role = req.user.role;

    // Common stats (needed for most roles)
    const [
      totalVehicles,
      availableVehicles,
      inMaintenance,
      totalDrivers,
      availableDrivers,
      onTripDrivers,
      totalTrips,
      completedTrips,
      dispatchedTrips,
      draftTrips,
      totalExpenses,
      recentTrips,
      recentExpenses,
      recentMaintenance,
      maintenanceAlerts,
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: "AVAILABLE" }),
      Vehicle.countDocuments({ status: "IN_SHOP" }),
      Driver.countDocuments(),
      Driver.countDocuments({ status: "AVAILABLE" }),
      Driver.countDocuments({ status: "ON_TRIP" }),
      Trip.countDocuments(),
      Trip.countDocuments({ status: "COMPLETED" }),
      Trip.countDocuments({ status: "DISPATCHED" }),
      Trip.countDocuments({ status: "DRAFT" }),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]),
      Trip.find().populate("vehicle driver").sort({ createdAt: -1 }).limit(5),
      Expense.find().populate("vehicle").sort({ date: -1 }).limit(5),
      Maintenance.find().populate("vehicle").sort({ createdAt: -1 }).limit(5),
      Maintenance.countDocuments({ status: "PENDING" }),
    ]);

    // Driver license expiry check (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringLicenses = await Driver.countDocuments({
      licenseExpiry: { $lte: thirtyDaysFromNow },
      status: { $ne: "SUSPENDED" },
    });

    // Expense breakdown
    const categoryExpenses = await Expense.aggregate([
      { $group: { _id: "$type", total: { $sum: "$cost" } } }
    ]);
    const fuelSpend = categoryExpenses.find(c => c._id === "FUEL")?.total || 0;
    const maintenanceSpend = categoryExpenses.find(c => c._id === "MAINTENANCE")?.total || 0;

    // Revenue calculation from completed trips
    const revenueStats = await Trip.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$revenue" } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    const totalExpensesValue = totalExpenses[0]?.total || 0;

    // Safety & Compliance stats
    const [expiredLicenses, suspendedDrivers, recentIncidents, incidentCount, expiredInsurance, expiredPermits] = await Promise.all([
      Driver.countDocuments({ licenseExpiry: { $lt: new Date() } }),
      Driver.countDocuments({ status: "SUSPENDED" }),
      require("../models/Incident").find().populate("vehicle driver").sort({ createdAt: -1 }).limit(5),
      require("../models/Incident").countDocuments(),
      Vehicle.countDocuments({ insuranceExpiry: { $lt: new Date() } }),
      Vehicle.countDocuments({ permitExpiry: { $lt: new Date() } }),
    ]);

    const driversWithScore = await Driver.find({ safetyScore: { $exists: true } });
    const avgSafetyScore = driversWithScore.length > 0 
      ? Math.round(driversWithScore.reduce((acc, d) => acc + d.safetyScore, 0) / driversWithScore.length)
      : 100;

    // Specific stats based on role
    const response = {
      totalVehicles,
      availableVehicles,
      inMaintenance,
      totalDrivers,
      availableDrivers,
      onTripDrivers,
      totalTrips,
      completedTrips,
      dispatchedTrips,
      draftTrips,
      totalExpenses: totalExpensesValue,
      totalRevenue,
      profit: totalRevenue - totalExpensesValue,
      fuelSpend,
      maintenanceSpend,
      recentTrips,
      recentExpenses,
      recentMaintenance,
      recentIncidents,
      maintenanceAlerts,
      expiringLicenses,
      expiredLicenses,
      suspendedDrivers,
      incidentCount,
      expiredInsurance,
      expiredPermits,
      avgSafetyScore,
      utilizationRate: totalVehicles > 0 ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100) : 0,
    };

    // Role-specific data additions
    if (role === "Dispatcher") {
      response.needsDispatch = await Trip.countDocuments({ status: "DRAFT" });
      response.activeTrips = await Trip.countDocuments({ status: "DISPATCHED" });
    }

    if (role === "FinancialAnalyst") {
      // Monthly expense aggregation for chart
      const monthlyExpenses = await Expense.aggregate([
        {
          $group: {
            _id: { month: { $month: "$date" }, year: { $year: "$date" } },
            total: { $sum: "$cost" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 6 }
      ]);
      response.monthlyExpenses = monthlyExpenses;
    }

    if (role === "SafetyOfficer") {
      response.suspendedDrivers = await Driver.countDocuments({ status: "SUSPENDED" });
      response.expiredLicenses = await Driver.countDocuments({ licenseExpiry: { $lt: new Date() } });
    }

    res.json(response);
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ msg: "Server error while fetching dashboard data" });
  }
};