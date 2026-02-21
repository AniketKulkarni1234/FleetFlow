// client/src/pages/Maintenance.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import toast from "react-hot-toast";
import { exportToCSV } from "../services/exportCSV";

const Maintenance = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", description: "" });
  const role = localStorage.getItem("role");

  const fetchLogs = () => { API.get("/api/maintenance").then((res) => setLogs(res.data)).catch((err) => console.log(err)); };
  const fetchVehicles = () => { API.get("/api/vehicles").then((res) => setVehicles(res.data)).catch(() => {}); };
  useEffect(() => { fetchLogs(); }, []);

  const handleOpenForm = () => { fetchVehicles(); setShowForm(!showForm); };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/maintenance", form);
      setForm({ vehicleId: "", description: "" });
      setShowForm(false);
      fetchLogs();
      toast.success("Maintenance logged — vehicle moved to IN_SHOP");
    } catch (err) { toast.error(err.response?.data?.msg || "Failed to log maintenance"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this maintenance log?")) return;
    try { await API.delete(`/api/maintenance/${id}`); fetchLogs(); toast.success("Log deleted"); }
    catch (err) { toast.error(err.response?.data?.msg || "Failed to delete"); }
  };

  const handleExport = () => {
    const data = logs.map((l) => ({ Vehicle: l.vehicle?.name || "N/A", Description: l.description, Date: new Date(l.date).toLocaleDateString() }));
    exportToCSV(data, "maintenance");
    toast.success("Exported to CSV");
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Maintenance</h1>
        <div className="flex gap-2 flex-wrap">
          {logs.length > 0 && <button onClick={handleExport} className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-sm">📥 Export CSV</button>}
          {(role === "Manager" || role === "SafetyOfficer") && <button onClick={handleOpenForm} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">{showForm ? "Cancel" : "+ Log Maintenance"}</button>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="border p-2.5 rounded-lg" required>
            <option value="">Select Vehicle</option>
            {vehicles.map((v) => (<option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>))}
          </select>
          <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border p-2.5 rounded-lg" required />
          <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium sm:col-span-2">Save</button>
        </form>
      )}

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🔧</p>
          <p className="text-gray-500">No maintenance logs yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Date</th>
                {role === "Manager" && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t text-sm hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{l.vehicle?.name || "N/A"}</td>
                  <td className="px-4 py-3">{l.description}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(l.date).toLocaleDateString()}</td>
                  {role === "Manager" && <td className="px-4 py-3"><button onClick={() => handleDelete(l._id)} className="text-red-500 hover:text-red-700 text-xs">🗑️</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default Maintenance;
