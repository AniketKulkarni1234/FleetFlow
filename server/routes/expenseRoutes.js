// server/routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  addExpense,
  getExpensesByVehicle,
  calculateTotalCost,
  deleteExpense,
} = require("../controllers/expenseController");

router.get("/:id", verifyToken, getExpensesByVehicle);
router.get("/:id/total", verifyToken, calculateTotalCost);
router.post("/", verifyToken, requireRole("Manager", "FinancialAnalyst"), addExpense);
router.delete("/:id", verifyToken, requireRole("Manager"), deleteExpense);

module.exports = router;