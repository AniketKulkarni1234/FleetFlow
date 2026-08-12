// server/routes/financeRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const { getFinanceSummary, getMonthlyFinanceReports } = require("../controllers/financeController");

router.get("/summary", verifyToken, getFinanceSummary);
router.get("/reports", verifyToken, requireRole("Manager", "FinancialAnalyst"), getMonthlyFinanceReports);

module.exports = router;
