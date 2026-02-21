// server/models/Vehicle.js
const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licensePlate: { type: String, required: true, unique: true },
  maxCapacity: { type: Number, required: true }, // kg
  odometer: { type: Number, default: 0 },
  status: { type: String, enum: ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"], default: "AVAILABLE" },
  acquisitionCost: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);