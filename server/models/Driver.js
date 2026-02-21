// server/models/Driver.js
const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  licenseExpiry: { type: Date, required: true },
  status: { type: String, enum: ["AVAILABLE", "ON_TRIP", "SUSPENDED"], default: "AVAILABLE" },
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);