// server/controllers/expenseController.js
const Expense = require("../models/Expense");

const hasRole = (req, ...roles) => req.user && roles.includes(req.user.role);

exports.addExpense = async (req, res) => {
  if (!hasRole(req, "Manager", "FinancialAnalyst")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getExpensesByVehicle = async (req, res) => {
  try {
    const expenses = await Expense.find({ vehicle: req.params.id });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.calculateTotalCost = async (req, res) => {
  try {
    const expenses = await Expense.find({ vehicle: req.params.id });
    const total = expenses.reduce((acc, e) => acc + e.cost, 0);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  if (!hasRole(req, "Manager")) return res.status(403).json({ msg: "Forbidden. Insufficient permissions." });
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ msg: "Expense not found" });
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ msg: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};