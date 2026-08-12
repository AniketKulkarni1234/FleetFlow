// server/controllers/financeController.js
const Trip = require("../models/Trip");
const Driver = require("../models/Driver");
const Expense = require("../models/Expense");
const Maintenance = require("../models/Maintenance");
const FuelEntry = require("../models/FuelEntry");

/**
 * GET /api/finance/summary
 * Computes live Trip Billing, Driver Salaries, Fuel Expenses, Maintenance Expenses, Profit/Loss
 */
exports.getFinanceSummary = async (req, res) => {
  try {
    // 1. Trip Billing (Total completed revenue)
    const completedTrips = await Trip.find({ status: "COMPLETED" });
    const tripBilling = completedTrips.reduce((acc, t) => acc + (t.revenue || 0), 0);

    // 2. Driver Salaries (Base salary sum + distance incentives per km)
    const drivers = await Driver.find();
    let totalDriverSalary = 0;
    drivers.forEach(d => {
      const incentivePay = (d.totalDistance || 0) * (d.salaryPerKm || 6.5);
      totalDriverSalary += (d.salaryBase || 22000) + incentivePay;
    });

    // 3. Fuel Expenses
    const fuelEntries = await FuelEntry.find();
    const fuelExpenses = fuelEntries.reduce((acc, f) => acc + (f.totalCost || 0), 0);

    // 4. Maintenance Expenses
    const maintenanceEntries = await Maintenance.find({ status: "RESOLVED" });
    const maintenanceExpenses = maintenanceEntries.reduce((acc, m) => acc + (m.serviceCost || 0), 0);

    // 5. Profit / Loss calculation
    const totalExpenses = totalDriverSalary + fuelExpenses + maintenanceExpenses;
    const netProfit = tripBilling - totalExpenses;

    res.json({
      summary: {
        tripBilling,
        totalDriverSalary,
        fuelExpenses,
        maintenanceExpenses,
        totalExpenses,
        netProfit,
        profitMargin: tripBilling > 0 ? parseFloat(((netProfit / tripBilling) * 100).toFixed(1)) : 0
      }
    });
  } catch (err) {
    console.error("Finance summary calculation failed:", err);
    res.status(500).json({ msg: "Failed to generate financial summaries" });
  }
};

/**
 * GET /api/finance/monthly-reports
 * Returns chronological billing, salaries, and profit margins grouped by month
 */
exports.getMonthlyFinanceReports = async (req, res) => {
  try {
    // Get month names helper array
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Aggregate Completed Trips Revenue by Month
    const tripAggregation = await Trip.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: { month: { $month: "$updatedAt" }, year: { $year: "$updatedAt" } },
          totalRevenue: { $sum: "$revenue" },
          tripsCount: { $sum: 1 }
        }
      }
    ]);

    // Aggregate Expenses by Month (from Expense collection which holds general and fuel costs)
    const expenseAggregation = await Expense.aggregate([
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          totalCost: { $sum: "$cost" }
        }
      }
    ]);

    // Map aggregates together
    const reportsMap = {};

    tripAggregation.forEach(t => {
      const key = `${t._id.year}-${t._id.month}`;
      reportsMap[key] = {
        year: t._id.year,
        month: t._id.month,
        name: `${months[t._id.month - 1]} ${t._id.year}`,
        billing: t.totalRevenue,
        costs: 0,
        trips: t.tripsCount
      };
    });

    expenseAggregation.forEach(e => {
      const key = `${e._id.year}-${e._id.month}`;
      if (!reportsMap[key]) {
        reportsMap[key] = {
          year: e._id.year,
          month: e._id.month,
          name: `${months[e._id.month - 1]} ${e._id.year}`,
          billing: 0,
          costs: 0,
          trips: 0
        };
      }
      reportsMap[key].costs += e.totalCost;
    });

    const formattedReports = Object.values(reportsMap).map(r => {
      // Estimate active driver salary share in that month's operations
      const estimatedDriverPayroll = r.trips * 12000; 
      const adjustedCosts = r.costs + estimatedDriverPayroll;
      const profit = r.billing - adjustedCosts;
      
      return {
        name: r.name,
        billing: r.billing,
        expenses: adjustedCosts,
        profit,
        margin: r.billing > 0 ? parseFloat(((profit / r.billing) * 100).toFixed(1)) : 0
      };
    }).sort((a,b) => {
      // sort chronologically
      return new Date(a.name) - new Date(b.name);
    });

    // Provide default reports if empty database to feed chart elements
    const finalReports = formattedReports.length > 0 ? formattedReports : [
      { name: "Jan 2026", billing: 145000, expenses: 110000, profit: 35000, margin: 24.1 },
      { name: "Feb 2026", billing: 185000, expenses: 135000, profit: 50000, margin: 27.0 },
      { name: "Mar 2026", billing: 220000, expenses: 160000, profit: 60000, margin: 27.3 },
      { name: "Apr 2026", billing: 250000, expenses: 180000, profit: 70000, margin: 28.0 }
    ];

    res.json(finalReports);
  } catch (err) {
    console.error("Monthly financial calculation failed:", err);
    res.status(500).json({ msg: "Failed to generate monthly reports" });
  }
};
