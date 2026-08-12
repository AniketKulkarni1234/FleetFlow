// server/services/vehicleService.js
const Vehicle = require("../models/Vehicle");

class VehicleService {
  async addVehicle({ name, licensePlate, maxCapacity, acquisitionCost }) {
    const existing = await Vehicle.findOne({ licensePlate: licensePlate.trim().toUpperCase() });
    if (existing) {
      const err = new Error("A vehicle with this license plate already exists");
      err.statusCode = 409;
      throw err;
    }

    return await Vehicle.create({
      name: name.trim(),
      licensePlate: licensePlate.trim().toUpperCase(),
      maxCapacity: Number(maxCapacity),
      acquisitionCost: Number(acquisitionCost) || 0,
    });
  }

  async getAllVehicles() {
    return await Vehicle.find().sort({ createdAt: -1 });
  }

  async updateVehicle(id, updateFields) {
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      const err = new Error("Vehicle not found");
      err.statusCode = 404;
      throw err;
    }
    return vehicle;
  }

  async updateVehicleStatus(id, status) {
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      const err = new Error("Vehicle not found");
      err.statusCode = 404;
      throw err;
    }
    return vehicle;
  }

  async deleteVehicle(id) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      const err = new Error("Vehicle not found");
      err.statusCode = 404;
      throw err;
    }
    if (vehicle.status === "ON_TRIP") {
      const err = new Error("Cannot delete vehicle on an active trip");
      err.statusCode = 400;
      throw err;
    }
    await Vehicle.findByIdAndDelete(id);
    return { msg: "Vehicle deleted successfully" };
  }
}

module.exports = new VehicleService();
