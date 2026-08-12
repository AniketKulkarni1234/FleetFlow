// client/src/pages/Vehicles.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import API from "../services/api";
import toast from "react-hot-toast";
import { exportToCSV } from "../services/exportCSV";
import { can } from "../services/permissions";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", licensePlate: "", maxCapacity: "", acquisitionCost: "" });
  const role = localStorage.getItem("role");

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/vehicles");
      setVehicles(res.data);
    } catch (err) {
      toast.error("Failed to load fleet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const resetForm = () => {
    setForm({ name: "", licensePlate: "", maxCapacity: "", acquisitionCost: "" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (vehicle) => {
    setForm({
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      maxCapacity: vehicle.maxCapacity,
      acquisitionCost: vehicle.acquisitionCost || "",
    });
    setEditingId(vehicle._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/api/vehicles/${editingId}`, form);
        toast.success("Vehicle updated successfully");
      } else {
        await API.post("/api/vehicles", form);
        toast.success("New vehicle registered");
      }
      resetForm();
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Operation failed");
    }
  };

  const handleStatusChange = async (id, status) => {
    if (!can(role, "changeVehicleStatus")) return toast.error("Unauthorized action");
    try {
      await API.put(`/api/vehicles/${id}/status`, { status });
      fetchVehicles();
      toast.success("Status synchronized");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    }
  };

  const handleDelete = async (id, name) => {
    if (!can(role, "deleteVehicle")) return toast.error("Unauthorized action");
    if (!window.confirm(`Permanently decommission unit "${name}"?`)) return;
    try {
      await API.delete(`/api/vehicles/${id}`);
      fetchVehicles();
      toast.success("Unit deleted");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Deletion blocked by active operations");
    }
  };

  const handleExport = () => {
    const data = filtered.map((v) => ({ 
      Name: v.name, 
      LicensePlate: v.licensePlate, 
      MaxCapacity: v.maxCapacity, 
      Status: v.status, 
      AcquisitionCost: v.acquisitionCost || 0 
    }));
    exportToCSV(data, "fleet_inventory");
    toast.success("Inventory exported");
  };

  const filtered = vehicles.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.licensePlate.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? v.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  // Calculate fleet stats
  const totalFleet = vehicles.length;
  const availableUnits = vehicles.filter(v => v.status === "AVAILABLE").length;
  const onTripUnits = vehicles.filter(v => v.status === "ON_TRIP").length;
  const inShopUnits = vehicles.filter(v => v.status === "IN_SHOP").length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.maxCapacity || 0), 0);

  return (
    <Layout>
      {/* Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Fleet Asset Control</h1>
          <p className="text-slate-400 mt-1">Real-time status, specs, maintenance health & deployment logs</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleExport} className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2">
            <span>📥</span> Export CSV
          </button>
          {can(role, "addVehicle") && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2">
              <span>➕</span> Add Unit
            </button>
          )}
        </div>
      </div>

      {/* Fleet KPI Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass p-5 rounded-2xl border-l-4 border-blue-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Fleet</p>
          <p className="text-3xl font-extrabold text-white">{totalFleet}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-emerald-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Available Units</p>
          <p className="text-3xl font-extrabold text-emerald-400">{availableUnits}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-sky-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Deployment</p>
          <p className="text-3xl font-extrabold text-sky-400">{onTripUnits}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">In Maintenance</p>
          <p className="text-3xl font-extrabold text-amber-400">{inShopUnits}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-purple-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Payload Cap.</p>
          <p className="text-2xl font-extrabold text-white">{(totalCapacity / 1000).toFixed(1)} <span className="text-sm font-normal text-slate-400">Tons</span></p>
        </div>
      </div>

      {/* Control Bar & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex-1 w-full relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none text-base z-10">🔍</span>
          <input 
            type="text" 
            placeholder="Search by vehicle name, license plate or ID..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="input-field input-with-icon w-full" 
          />
        </div>

        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="input-field min-w-[180px]"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Deployment</option>
            <option value="IN_SHOP">In Maintenance</option>
            <option value="RETIRED">Retired</option>
          </select>

          {/* Toggle View Mode */}
          <div className="flex bg-slate-900 border border-slate-700/80 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "grid" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-white"}`}
              title="Grid Card View"
            >
              📱 Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "table" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-white"}`}
              title="Table View"
            >
              📄 Table
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 skeleton w-full"></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-20 text-center rounded-3xl">
          <div className="text-6xl mb-6 opacity-20">🚛</div>
          <h3 className="text-xl font-bold text-slate-300">No Fleet Units Found</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">No vehicles match your search query or status filter.</p>
          <button onClick={() => {setSearch(""); setStatusFilter("");}} className="mt-6 text-blue-400 font-bold hover:underline">Clear all filters</button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filtered.map((v) => (
            <div key={v._id} className="glass p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group flex flex-col justify-between">
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-white/5 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                      🚛
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors leading-tight">{v.name}</h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{v.licensePlate}</p>
                    </div>
                  </div>
                  <StatusPill status={v.status} />
                </div>

                {/* Technical Specifications */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block">Payload Limit</span>
                    <span className="font-bold text-slate-200">{v.maxCapacity?.toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Acquisition Value</span>
                    <span className="font-bold text-emerald-400">₹{(v.acquisitionCost || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">System UID</span>
                    <span className="font-mono text-slate-400">#{v._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Health Rating</span>
                    <span className="font-bold text-blue-400">{v.status === 'IN_SHOP' ? 'Maintenance' : 'Optimal'}</span>
                  </div>
                </div>

                {/* Health & Service Progress Indicator */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Operational Health</span>
                    <span className="text-emerald-400 font-bold">{v.status === 'IN_SHOP' ? '45%' : '98%'}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${v.status === 'IN_SHOP' ? 'bg-amber-500 w-[45%]' : 'bg-emerald-500 w-[98%]'}`}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  {can(role, "changeVehicleStatus") ? (
                    <select 
                      value={v.status} 
                      onChange={(e) => handleStatusChange(v._id, e.target.value)} 
                      className="bg-slate-900 text-xs font-semibold text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="AVAILABLE">Set Available</option>
                      <option value="ON_TRIP">Set Deployment</option>
                      <option value="IN_SHOP">Set Maintenance</option>
                      <option value="RETIRED">Set Retired</option>
                    </select>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">Status Locked</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {can(role, "addVehicle") && (
                    <button onClick={() => handleEdit(v)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition" title="Edit Unit Specs">
                      ✏️
                    </button>
                  )}
                  {can(role, "deleteVehicle") && (
                    <button onClick={() => handleDelete(v._id, v.name)} className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition" title="Decommission Unit">
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="table-container animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-4">Vehicle Identity</th>
                  <th className="px-6 py-4">License Registry</th>
                  <th className="px-6 py-4">Payload Cap.</th>
                  <th className="px-6 py-4">Asset Value</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((v) => (
                  <tr key={v._id} className="table-row group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                          🚛
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{v.name}</p>
                          <p className="text-xs text-slate-500 font-mono">UID: #{v._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-sm text-slate-300">{v.licensePlate}</td>
                    <td className="px-6 py-5 text-sm">
                      <span className="font-bold text-slate-200">{v.maxCapacity?.toLocaleString()}</span>
                      <span className="text-slate-500 ml-1">kg</span>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-emerald-400">
                      ₹{(v.acquisitionCost || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      {can(role, "changeVehicleStatus") ? (
                        <select 
                          value={v.status} 
                          onChange={(e) => handleStatusChange(v._id, e.target.value)} 
                          className="bg-slate-900 text-xs font-semibold text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="ON_TRIP">Deployment</option>
                          <option value="IN_SHOP">Maintenance</option>
                          <option value="RETIRED">Retired</option>
                        </select>
                      ) : (
                        <StatusPill status={v.status} />
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        {can(role, "addVehicle") && (
                          <button onClick={() => handleEdit(v)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition" title="Edit Unit">
                            ✏️
                          </button>
                        )}
                        {can(role, "deleteVehicle") && (
                          <button onClick={() => handleDelete(v._id, v.name)} className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition" title="Decommission">
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={resetForm} 
        title={editingId ? "Update Vehicle Details" : "Register New Vehicle Unit"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Identification Name</label>
              <input 
                type="text" 
                placeholder="e.g. Scania Heavy Duty R-450" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="input-field w-full" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">License Registry</label>
              <input 
                type="text" 
                placeholder="MH-01-AX-1234" 
                value={form.licensePlate} 
                onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} 
                className="input-field w-full" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Max Capacity (kg)</label>
              <input 
                type="number" 
                placeholder="45000" 
                value={form.maxCapacity} 
                onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} 
                className="input-field w-full" 
                required 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Acquisition Value (₹)</label>
              <input 
                type="number" 
                placeholder="7500000" 
                value={form.acquisitionCost} 
                onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} 
                className="input-field w-full" 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{editingId ? "Commit Changes" : "Confirm Registration"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Vehicles;