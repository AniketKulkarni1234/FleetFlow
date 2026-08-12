// server/models/FuelEntry.js
const mongoose = require("mongoose");

const fuelEntrySchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  liters: { type: Number, required: true },
  costPerLiter: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  odometerReading: { type: Number, required: true }, // Needed to calculate mileage / efficiency
  fuelStation: { type: String, default: "" },
  billUrl: { type: String, default: "" }, // Reference bill image / PDF
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("FuelEntry", fuelEntrySchema);
