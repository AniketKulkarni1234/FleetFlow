// server/routes/leaveRequestRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
  deleteLeaveRequest,
} = require("../controllers/leaveRequestController");

router.get("/", verifyToken, getLeaveRequests);
router.post("/", verifyToken, requireRole("Manager"), createLeaveRequest);
router.put("/:id/status", verifyToken, requireRole("Manager"), updateLeaveStatus);
router.delete("/:id", verifyToken, deleteLeaveRequest);

module.exports = router;
