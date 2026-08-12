// server/models/Driver.js
const mongoose = require("mongoose");

const driverDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["License", "MedicalCertificate", "TrainingCertificate", "Other"], required: true },
  docNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  fileUrl: { type: String, default: "" },
});

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  licenseExpiry: { type: Date, required: true },
  status: { type: String, enum: ["AVAILABLE", "ON_TRIP", "SUSPENDED"], default: "AVAILABLE" },
  safetyScore: { type: Number, default: 100 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phone: { type: String, default: "" },
  salaryBase: { type: Number, default: 22000 }, // Base salary per month (₹)
  salaryPerKm: { type: Number, default: 6.5 },   // Pay rate per km driven (₹)
  totalTrips: { type: Number, default: 0 },
  totalDistance: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  documents: [driverDocumentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);