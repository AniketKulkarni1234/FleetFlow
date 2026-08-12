// client/src/pages/Maintenance.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import API from "../services/api";
import toast from "react-hot-toast";
import { can } from "../services/permissions";

const Maintenance = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("ALL"); // 'ALL', 'PENDING', 'RESOLVED'
  const [form, setForm] = useState({ vehicleId: "", description: "" });
  const role = localStorage.getItem("role");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        API.get("/api/maintenance"),
        API.get("/api/vehicles"),
      ]);
      setLogs(logsRes.data);
      // Only vehicles NOT currently in shop or retired
      setVehicles(vehiclesRes.data.filter(v => v.status === "AVAILABLE"));
    } catch (err) {
      toast.error("Failed to sync maintenance ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLog = async (e) => {
    e.preventDefault();
    if (!can(role, "addMaintenance")) return toast.error("Unauthorized action");
    try {
      await API.post("/api/maintenance", form);
      toast.success("Maintenance request initialized. Unit marked IN_SHOP.");
      setShowModal(false);
      setForm({ vehicleId: "", description: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Logging failed");
    }
  };

  const handleResolve = async (id) => {
    try {
      await API.put(`/api/maintenance/${id}/resolve`);
      toast.success("Maintenance RESOLVED. Unit returned to AVAILABLE status.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Resolution failed");
    }
  };

  const handleDelete = async (id) => {
    if (!can(role, "deleteMaintenance")) return toast.error("Unauthorized action");
    if (!window.confirm("Purge this record from ledger?")) return;
    try {
      await API.delete(`/api/maintenance/${id}`);
      fetchData();
      toast.success("Record purged");
    } catch (err) {
      toast.error("Failed to delete record");
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === "PENDING") return log.status === "PENDING";
    if (filter === "RESOLVED") return log.status === "RESOLVED";
    return true;
  });

  const totalLogs = logs.length;
  const pendingCount = logs.filter(l => l.status === "PENDING").length;
  const resolvedCount = logs.filter(l => l.status === "RESOLVED").length;
  const healthPercentage = totalLogs > 0 ? Math.round((resolvedCount / totalLogs) * 100) : 100;

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Maintenance & Service Ledger</h1>
          <p className="text-slate-400 mt-1">Audit vehicle diagnostic alerts, repair manifests & service resolutions</p>
        </div>
        {can(role, "addMaintenance") && (
          <button onClick={() => setShowModal(true)} className="btn-primary bg-amber-600 hover:bg-amber-700 border-amber-500/30 flex items-center gap-2">
            <span>🔧</span> Schedule Repair
          </button>
        )}
      </div>

      {/* KPI Stats Header Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Service Records</p>
          <p className="text-3xl font-extrabold text-white">{totalLogs}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-rose-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Repairs (In-Shop)</p>
          <p className="text-3xl font-extrabold text-rose-400">{pendingCount}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-emerald-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Resolved Inspections</p>
          <p className="text-3xl font-extrabold text-emerald-400">{resolvedCount}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-blue-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Fleet Service Health</p>
          <p className="text-3xl font-extrabold text-blue-400">{healthPercentage}%</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 bg-slate-900 border border-slate-700/80 rounded-xl p-1.5 w-fit">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${filter === "ALL" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-white"}`}
        >
          All Records ({totalLogs})
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${filter === "PENDING" ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "text-slate-400 hover:text-white"}`}
        >
          In Shop ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("RESOLVED")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${filter === "RESOLVED" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-slate-400 hover:text-white"}`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton w-full"></div>)}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass p-20 text-center rounded-3xl">
          <div className="text-6xl mb-6 opacity-20">🔧</div>
          <h3 className="text-xl font-bold text-slate-300">No Service Records Found</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">No maintenance tasks match the selected filter category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLogs.map((log) => (
            <div key={log._id} className="glass group p-6 rounded-2xl border-white/5 hover:border-amber-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex gap-5 items-start flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${log.status === 'RESOLVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  {log.status === 'RESOLVED' ? '✅' : '🛠️'}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{log.vehicle?.name || "Decommissioned Unit"}</h3>
                    <span className="text-xs font-mono text-slate-400 px-2 py-0.5 bg-slate-800 rounded border border-white/5">{log.vehicle?.licensePlate || "N/A"}</span>
                    <StatusPill status={log.status === 'RESOLVED' ? 'AVAILABLE' : 'IN_SHOP'} />
                  </div>
                  
                  <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">{log.description}</p>
                  
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Initialized: {new Date(log.createdAt).toLocaleDateString()}</span>
                    {log.resolvedAt && (
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Resolved: {new Date(log.resolvedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                {log.status === "PENDING" && (
                  <button onClick={() => handleResolve(log._id)} className="btn-success flex items-center gap-2">
                    <span>✅</span> Resolve Request
                  </button>
                )}
                {can(role, "deleteMaintenance") && (
                  <button onClick={() => handleDelete(log._id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition" title="Delete Log">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Initialize Vehicle Service Request">
        <form onSubmit={handleLog} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Vehicle Unit *</label>
              <select className="input-field w-full" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} required>
                <option value="">Select Available Unit for Maintenance</option>
                {vehicles.map(v => <option key={v._id} value={v._id} className="bg-slate-900">{v.name} ({v.licensePlate})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Diagnostic Manifest / Issue Description *</label>
              <textarea 
                placeholder="Describe the technical defects, required parts replacement, or routine maintenance procedures..." 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
                className="input-field w-full min-h-[120px] resize-none" 
                required 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 bg-amber-600 hover:bg-amber-700 border-amber-500/30">Log Service Request</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Maintenance;

