// server/controllers/leaveRequestController.js
const LeaveRequest = require("../models/LeaveRequest");
const Driver = require("../models/Driver");

exports.createLeaveRequest = async (req, res) => {
  try {
    const { driverId, startDate, endDate, reason } = req.body;

    if (!driverId || !startDate || !endDate || !reason) {
      return res.status(400).json({ msg: "Driver, start date, end date, and reason are required" });
    }

    if (reason.trim().length < 3) {
      return res.status(400).json({ msg: "Reason must be at least 3 characters" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ msg: "Start date must be before or equal to end date" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ msg: "Driver not found" });
    }

    const leave = await LeaveRequest.create({
      driver: driverId,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      status: "PENDING",
    });

    const populated = await LeaveRequest.findById(leave._id).populate("driver");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create Leave Error:", err);
    res.status(500).json({ msg: "Server error. Failed to create leave request." });
  }
};

exports.getLeaveRequests = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate("driver").sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error("Get Leaves Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const leave = await LeaveRequest.findById(req.params.id).populate("driver");
    if (!leave) {
      return res.status(404).json({ msg: "Leave request not found" });
    }

    leave.status = status;
    await leave.save();

    // Optionally update driver status to suspended if approved, or handle it simply
    res.json(leave);
  } catch (err) {
    console.error("Update Leave Status Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteLeaveRequest = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ msg: "Leave request not found" });
    }
    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.json({ msg: "Leave request deleted successfully" });
  } catch (err) {
    console.error("Delete Leave request Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
