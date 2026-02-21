// client/src/pages/Vehicles.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import API from "../services/api";
import toast from "react-hot-toast";
import { exportToCSV } from "../services/exportCSV";
import { can } from "../services/permissions";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", licensePlate: "", maxCapacity: "", acquisitionCost: "" });
  const role = localStorage.getItem("role");

  const fetchVehicles = () => {
    API.get("/api/vehicles").then((res) => setVehicles(res.data)).catch((err) => console.log(err));
  };
  useEffect(() => { fetchVehicles(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!can(role, "addVehicle")) return toast.error("Insufficient permissions");
    try {
      await API.post("/api/vehicles", { ...form, maxCapacity: Number(form.maxCapacity), acquisitionCost: Number(form.acquisitionCost || 0) });
      setForm({ name: "", licensePlate: "", maxCapacity: "", acquisitionCost: "" });
      setShowForm(false);
      fetchVehicles();
      toast.success("Vehicle added successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add vehicle");
    }
  };

  const handleStatusChange = async (id, status) => {
    if (!can(role, "changeVehicleStatus")) return toast.error("Insufficient permissions");
    try {
      await API.put(`/api/vehicles/${id}/status`, { status });
      fetchVehicles();
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!can(role, "deleteVehicle")) return toast.error("Insufficient permissions");
    if (!window.confirm(`Delete vehicle "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/api/vehicles/${id}`);
      fetchVehicles();
      toast.success("Vehicle deleted");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to delete");
    }
  };

  const handleExport = () => {
    const data = filtered.map((v) => ({ Name: v.name, LicensePlate: v.licensePlate, MaxCapacity: v.maxCapacity, Status: v.status, AcquisitionCost: v.acquisitionCost || 0 }));
    exportToCSV(data, "vehicles");
    toast.success("Exported to CSV");
  };

  const filtered = vehicles.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.licensePlate.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? v.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Vehicles</h1>
        <div className="flex gap-2 flex-wrap">
          {filtered.length > 0 && <button onClick={handleExport} className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-sm">📥 Export CSV</button>}
          {can(role, "addVehicle") && <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">{showForm ? "Cancel" : "+ Add Vehicle"}</button>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="text" placeholder="Vehicle Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          <input type="text" placeholder="License Plate" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          <input type="number" placeholder="Max Capacity (kg)" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          <input type="number" placeholder="Acquisition Cost (₹)" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium sm:col-span-2 lg:col-span-4">Save Vehicle</button>
        </form>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="🔍 Search by name or plate..." value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2.5 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🚛</p>
          <p className="text-gray-500">{vehicles.length === 0 ? "No vehicles added yet." : "No vehicles match your search."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">License Plate</th>
                <th className="px-4 py-3 text-left">Max Capacity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v._id} className="border-t text-sm hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3">{v.licensePlate}</td>
                  <td className="px-4 py-3">{v.maxCapacity} kg</td>
                  <td className="px-4 py-3"><StatusPill status={v.status} /></td>
                  <td className="px-4 py-3 flex gap-2 items-center">
                    {can(role, "changeVehicleStatus") && (
                      <select value={v.status} onChange={(e) => handleStatusChange(v._id, e.target.value)} className="border p-1 rounded text-xs">
                        <option value="AVAILABLE">Available</option>
                        <option value="ON_TRIP">On Trip</option>
                        <option value="IN_SHOP">In Shop</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                    )}
                    {can(role, "deleteVehicle") && (
                      <button onClick={() => handleDelete(v._id, v.name)} className="text-red-500 hover:text-red-700 text-xs font-medium">🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default Vehicles;