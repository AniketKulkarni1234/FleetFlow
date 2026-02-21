// client/src/pages/Trips.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import API from "../services/api";
import toast from "react-hot-toast";
import { exportToCSV } from "../services/exportCSV";
import { can } from "../services/permissions";

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ vehicleId: "", driverId: "", cargoWeight: "" });
  const role = localStorage.getItem("role");

  const fetchTrips = () => { API.get("/api/trips").then((res) => setTrips(res.data)).catch((err) => console.log(err)); };
  const fetchOptions = () => {
    API.get("/api/vehicles").then((res) => setVehicles(res.data.filter((v) => v.status === "AVAILABLE"))).catch(() => {});
    API.get("/api/drivers").then((res) => setDrivers(res.data.filter((d) => d.status === "AVAILABLE"))).catch(() => {});
  };
  useEffect(() => { fetchTrips(); }, []);

  const handleOpenForm = () => { fetchOptions(); setShowForm(!showForm); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!can(role, "createTrip")) return toast.error("Insufficient permissions");
    try {
      await API.post("/api/trips", { ...form, cargoWeight: Number(form.cargoWeight) });
      setForm({ vehicleId: "", driverId: "", cargoWeight: "" });
      setShowForm(false);
      fetchTrips();
      toast.success("Trip created successfully");
    } catch (err) { toast.error(err.response?.data?.msg || "Failed to create trip"); }
  };

  const handleComplete = async (id) => {
    if (!can(role, "completeTrip")) return toast.error("Insufficient permissions");
    try { await API.put(`/api/trips/${id}/complete`); fetchTrips(); toast.success("Trip completed"); }
    catch (err) { toast.error(err.response?.data?.msg || "Failed to complete trip"); }
  };

  const handleCancel = async (id) => {
    if (!can(role, "cancelTrip")) return toast.error("Insufficient permissions");
    if (!window.confirm("Cancel this trip? Vehicle & driver will be freed.")) return;
    try { await API.put(`/api/trips/${id}/cancel`); fetchTrips(); toast.success("Trip cancelled"); }
    catch (err) { toast.error(err.response?.data?.msg || "Failed to cancel trip"); }
  };

  const handleExport = () => {
    const data = filtered.map((t) => ({ Vehicle: t.vehicle?.name || "N/A", Driver: t.driver?.name || "N/A", CargoWeight: t.cargoWeight, Status: t.status, Date: new Date(t.createdAt).toLocaleDateString() }));
    exportToCSV(data, "trips");
    toast.success("Exported to CSV");
  };

  const filtered = trips.filter((t) => {
    const matchSearch = (t.vehicle?.name || "").toLowerCase().includes(search.toLowerCase()) || (t.driver?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? t.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Trips</h1>
        <div className="flex gap-2 flex-wrap">
          {filtered.length > 0 && <button onClick={handleExport} className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-sm">📥 Export CSV</button>}
          {can(role, "createTrip") && <button onClick={handleOpenForm} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">{showForm ? "Cancel" : "+ Create Trip"}</button>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="border p-2.5 rounded-lg" required>
            <option value="">Select Vehicle</option>
            {vehicles.map((v) => (<option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>))}
          </select>
          <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="border p-2.5 rounded-lg" required>
            <option value="">Select Driver</option>
            {drivers.map((d) => (<option key={d._id} value={d._id}>{d.name}</option>))}
          </select>
          <input type="number" placeholder="Cargo Weight (kg)" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} className="border p-2.5 rounded-lg" required />
          <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium sm:col-span-3">Create Trip</button>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="🔍 Search by vehicle or driver..." value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2.5 rounded-lg flex-1" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2.5 rounded-lg">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-gray-500">{trips.length === 0 ? "No trips yet. Add vehicles & drivers first." : "No trips match your filter."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Driver</th>
                <th className="px-4 py-3 text-left">Cargo</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t._id} className="border-t text-sm hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{t.vehicle?.name || "N/A"}</td>
                  <td className="px-4 py-3">{t.driver?.name || "N/A"}</td>
                  <td className="px-4 py-3">{t.cargoWeight} kg</td>
                  <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2">
                    {t.status !== "COMPLETED" && t.status !== "CANCELLED" && can(role, "completeTrip") && (
                      <>
                        <button onClick={() => handleComplete(t._id)} className="bg-green-500 text-white px-2.5 py-1 rounded text-xs hover:bg-green-600">✅ Complete</button>
                        <button onClick={() => handleCancel(t._id)} className="bg-red-500 text-white px-2.5 py-1 rounded text-xs hover:bg-red-600">❌ Cancel</button>
                      </>
                    )}
                    {(t.status === "COMPLETED" || t.status === "CANCELLED") && <span className="text-gray-400 text-xs">—</span>}
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

export default Trips;