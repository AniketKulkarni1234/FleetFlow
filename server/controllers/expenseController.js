// server/controllers/expenseController.js
const Expense = require("../models/Expense");

exports.addExpense = async (req, res) => {
  try {
    const { vehicle, type, cost, liters } = req.body;

    // Input validation
    if (!vehicle || !type || cost === undefined) {
      return res.status(400).json({ msg: "Vehicle, type, and cost are required" });
    }
    if (!["FUEL", "MAINTENANCE"].includes(type)) {
      return res.status(400).json({ msg: "Type must be FUEL or MAINTENANCE" });
    }
    if (Number(cost) <= 0) {
      return res.status(400).json({ msg: "Cost must be greater than 0" });
    }

    const expense = await Expense.create({
      vehicle,
      type,
      cost: Number(cost),
      liters: type === "FUEL" ? Number(liters) || 0 : 0,
    });

    const populated = await Expense.findById(expense._id).populate("vehicle");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate("vehicle").sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.getExpensesByVehicle = async (req, res) => {
  try {
    const expenses = await Expense.find({ vehicle: req.params.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.calculateTotalCost = async (req, res) => {
  try {
    const expenses = await Expense.find({ vehicle: req.params.id });
    const total = expenses.reduce((acc, e) => acc + e.cost, 0);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ msg: "Expense not found" });
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ msg: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error. Please try again." });
  }
};