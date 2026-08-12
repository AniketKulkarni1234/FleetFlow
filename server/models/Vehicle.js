// server/models/Vehicle.js
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["RC", "Insurance", "Permit", "PUC", "Other"], required: true },
  docNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  fileUrl: { type: String, default: "" }, // Stores reference mock PDFs / download attachments
});

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licensePlate: { type: String, required: true, unique: true },
  maxCapacity: { type: Number, required: true }, // kg
  odometer: { type: Number, default: 0 },
  status: { type: String, enum: ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"], default: "AVAILABLE" },
  acquisitionCost: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  insuranceExpiry: { type: Date },
  permitExpiry: { type: Date },
  rcNumber: { type: String, default: "" },
  rcExpiry: { type: Date },
  pucNumber: { type: String, default: "" },
  pucExpiry: { type: Date },
  documents: [documentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);