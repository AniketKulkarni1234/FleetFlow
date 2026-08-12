// server/models/Maintenance.js
const mongoose = require("mongoose");

const sparePartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cost: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
});

const vendorDetailsSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
});

const maintenanceSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "RESOLVED", "UPCOMING"], default: "PENDING" },
  date: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  scheduledDate: { type: Date }, // Calendar schedule / Upcoming services date
  serviceType: { type: String, enum: ["Scheduled", "Breakdown", "General"], default: "Scheduled" },
  serviceCost: { type: Number, default: 0 },
  spareParts: [sparePartSchema],
  vendor: vendorDetailsSchema,
  invoiceUrl: { type: String, default: "" }, // Stores reference mock invoices
}, { timestamps: true });

module.exports = mongoose.model("Maintenance", maintenanceSchema);