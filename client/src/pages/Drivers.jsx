// client/src/pages/Drivers.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import API from "../services/api";
import toast from "react-hot-toast";
import { exportToCSV } from "../services/exportCSV";
import { can } from "../services/permissions";

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", licenseNumber: "", licenseExpiry: "" });
  const role = localStorage.getItem("role");

  const fetchDrivers = () => {
    API.get("/api/drivers").then((res) => setDrivers(res.data)).catch((err) => console.log(err));
  };
  useEffect(() => { fetchDrivers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!can(role, "addDriver")) return toast.error("Insufficient permissions");
    try {
      await API.post("/api/drivers", form);
      setForm({ name: "", licenseNumber: "", licenseExpiry: "" });
      setShowForm(false);
      fetchDrivers();
      toast.success("Driver added successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add driver");
    }
  };

  const handleStatusChange = async (id, status) => {
    if (!can(role, "changeDriverStatus")) return toast.error("Insufficient permissions");
    try {
      await API.put(`/api/drivers/${id}/status`, { status });
      fetchDrivers();
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!can(role, "deleteDriver")) return toast.error("Insufficient permissions");
    if (!window.confirm(`Delete driver "${name}"?`)) return;
    try {
      await API.delete(`/api/drivers/${id}`);
      fetchDrivers();
      toast.success("Driver deleted");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to delete");
    }
  };

  const handleExport = () => {
    const data = filtered.map((d) => ({ Name: d.name, LicenseNumber: d.licenseNumber, LicenseExpiry: new Date(d.licenseExpiry).toLocaleDateString(), Status: d.status }));
    exportToCSV(data, "drivers");
    toast.success("Exported to CSV");
  };

  const isExpiringSoon = (date) => {
    const diff = new Date(date) - new Date();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const filtered = drivers.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Drivers</h1>
        <div className="flex gap-2 flex-wrap">
          {filtered.length > 0 && <button onClick={handleExport} className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-sm">📥 Export CSV</button>}
          {can(role, "addDriver") && <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">{showForm ? "Cancel" : "+ Add Driver"}</button>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Driver Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          <input type="text" placeholder="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          <input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium sm:col-span-3">Save Driver</button>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="🔍 Search by name or license..." value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2.5 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-gray-500">{drivers.length === 0 ? "No drivers added yet." : "No drivers match your search."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">License Number</th>
                <th className="px-4 py-3 text-left">License Expiry</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id} className="border-t text-sm hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3">{d.licenseNumber}</td>
                  <td className="px-4 py-3">
                    <span className={isExpiringSoon(d.licenseExpiry) ? "text-amber-600 font-semibold" : ""}>
                      {new Date(d.licenseExpiry).toLocaleDateString()}
                      {isExpiringSoon(d.licenseExpiry) && " ⚠️"}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                  <td className="px-4 py-3 flex gap-2 items-center">
                    {can(role, "changeDriverStatus") && (
                      <select value={d.status} onChange={(e) => handleStatusChange(d._id, e.target.value)} className="border p-1 rounded text-xs">
                        <option value="AVAILABLE">Available</option>
                        <option value="ON_TRIP">On Trip</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    )}
                    {can(role, "deleteDriver") && <button onClick={() => handleDelete(d._id, d.name)} className="text-red-500 hover:text-red-700 text-xs font-medium">🗑️</button>}
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

export default Drivers;