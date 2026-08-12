// server/models/Trip.js
const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  cargoWeight: { type: Number, required: true },
  status: { type: String, enum: ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"], default: "DRAFT" },
  distance: { type: Number, default: 0 }, // km
  fuelUsed: { type: Number, default: 0 }, // liters
  revenue: { type: Number, default: 0 },
  // Route information
  origin: { type: String, default: "" },
  destination: { type: String, default: "" },
  // Scheduling
  scheduledDate: { type: Date },
  estimatedDistance: { type: Number, default: 0 },
  estimatedFuelCost: { type: Number, default: 0 },
  // Timing
  actualDepartureTime: { type: Date },
  actualArrivalTime: { type: Date },
  // Notes
  notes: { type: String, default: "" },
  // Real-time Telemetry
  routeCoordinates: { type: [[Number]], default: [] },
  currentLat: { type: Number },
  currentLng: { type: Number },
  currentRouteIndex: { type: Number, default: 0 },
  currentSpeed: { type: Number, default: 0 },
  currentHeading: { type: Number, default: 0 },
  lastTelemetryUpdate: { type: Date },
  telemetryStatus: { type: String, enum: ["MOVING", "IDLE", "STOPPED", "OFFLINE"], default: "STOPPED" },
}, { timestamps: true });

module.exports = mongoose.model("Trip", tripSchema);