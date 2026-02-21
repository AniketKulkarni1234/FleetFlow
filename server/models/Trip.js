// server/models/Trip.js
const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  cargoWeight: { type: Number, required: true },
  status: { type: String, enum: ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"], default: "DRAFT" },
  distance: { type: Number, default: 0 }, // km
  fuelUsed: { type: Number, default: 0 }, // liters
}, { timestamps: true });

module.exports = mongoose.model("Trip", tripSchema);