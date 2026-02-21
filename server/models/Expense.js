// server/models/Expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  liters: { type: Number, default: 0 },
  cost: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ["FUEL", "MAINTENANCE"], required: true },
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);