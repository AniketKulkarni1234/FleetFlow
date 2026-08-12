// server/models/LeaveRequest.js
const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
}, { timestamps: true });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
