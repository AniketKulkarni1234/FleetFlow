// client/src/pages/Drivers.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import API from "../services/api";
import toast from "react-hot-toast";
import { exportToCSV } from "../services/exportCSV";
import { can } from "../services/permissions";

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState("roster"); // 'roster' or 'leaves'
  const [showModal, setShowModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", licenseNumber: "", licenseExpiry: "" });
  const [leaveForm, setLeaveForm] = useState({ driverId: "", startDate: "", endDate: "", reason: "" });
  const [leaves, setLeaves] = useState([]);
  const role = localStorage.getItem("role");

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const [driversRes, leavesRes] = await Promise.all([
        API.get("/api/drivers"),
        API.get("/api/leaves").catch(() => ({ data: [] })),
      ]);
      setDrivers(driversRes.data);
      setLeaves(leavesRes.data);
    } catch (err) {
      toast.error("Failed to load personnel data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const resetForm = () => {
    setForm({ name: "", licenseNumber: "", licenseExpiry: "" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleLeaveStatusChange = async (id, status) => {
    try {
      await API.put(`/api/leaves/${id}/status`, { status });
      toast.success(`Leave request is now ${status}`);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/leaves", leaveForm);
      toast.success("Leave request submitted successfully");
      setShowLeaveModal(false);
      setLeaveForm({ driverId: "", startDate: "", endDate: "", reason: "" });
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to submit leave request");
    }
  };

  const handleEdit = (driver) => {
    setForm({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: new Date(driver.licenseExpiry).toISOString().split('T')[0],
    });
    setEditingId(driver._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/api/drivers/${editingId}`, form);
        toast.success("Driver details updated");
      } else {
        await API.post("/api/drivers", form);
        toast.success("Personnel registered successfully");
      }
      resetForm();
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Operation failed");
    }
  };

  const handleStatusChange = async (id, status) => {
    if (!can(role, "changeDriverStatus")) return toast.error("Unauthorized action");
    try {
      await API.put(`/api/drivers/${id}/status`, { status });
      fetchDrivers();
      toast.success("Personnel status updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    }
  };

  const handleDelete = async (id, name) => {
    if (!can(role, "deleteDriver")) return toast.error("Unauthorized action");
    if (!window.confirm(`Remove driver "${name}" from active duty?`)) return;
    try {
      await API.delete(`/api/drivers/${id}`);
      fetchDrivers();
      toast.success("Personnel removed");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Action blocked by active trip assignment");
    }
  };

  const handleExport = () => {
    const data = filtered.map((d) => ({ 
      Name: d.name, 
      License: d.licenseNumber, 
      Expiry: new Date(d.licenseExpiry).toLocaleDateString(), 
      Status: d.status 
    }));
    exportToCSV(data, "personnel_roster");
    toast.success("Roster exported");
  };

  const filtered = drivers.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Personnel Roster</h1>
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setView("roster")} 
              className={`text-sm font-bold uppercase tracking-widest pb-1 border-b-2 transition ${view === 'roster' ? 'text-blue-400 border-blue-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
            >
              Active Roster
            </button>
            <button 
              onClick={() => setView("leaves")} 
              className={`text-sm font-bold uppercase tracking-widest pb-1 border-b-2 transition ${view === 'leaves' ? 'text-blue-400 border-blue-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
            >
              Leave Requests
            </button>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {view === "roster" ? (
            <>
              <button onClick={handleExport} className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2">
                <span>📥</span> Export Roster
              </button>
              {can(role, "addDriver") && (
                <button onClick={() => setShowModal(true)} className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2">
                  <span>➕</span> Add Personnel
                </button>
              )}
            </>
          ) : (
            can(role, "addDriver") && (
              <button onClick={() => setShowLeaveModal(true)} className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2">
                <span>➕</span> Request Leave
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-3 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none text-base z-10">🔍</span>
          <input 
            type="text" 
            placeholder="Search by name or license number..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="input-field input-with-icon w-full" 
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
          <option value="">Filter by Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">Deployed</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 skeleton w-full"></div>)}
        </div>
      ) : view === "leaves" ? (
        leaves.length === 0 ? (
          <div className="glass p-20 text-center rounded-3xl opacity-50 font-bold text-slate-500">
            No pending leave requests from active personnel.
          </div>
        ) : (
          <div className="table-container animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Range</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaves.map((l) => (
                    <tr key={l._id} className="table-row group">
                      <td className="px-6 py-5">
                        <p className="font-bold text-white uppercase tracking-tight">{l.driver?.name || "Unknown Driver"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{l.driver?.licenseNumber}</p>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-400">
                        {new Date(l.startDate).toLocaleDateString()} ➔ {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-300 max-w-xs truncate" title={l.reason}>
                        {l.reason}
                      </td>
                      <td className="px-6 py-5">
                        <StatusPill status={l.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-3">
                          {l.status === "PENDING" && role === "Manager" && (
                            <>
                              <button
                                onClick={() => handleLeaveStatusChange(l._id, "APPROVED")}
                                className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-600/40 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleLeaveStatusChange(l._id, "REJECTED")}
                                className="px-3 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold hover:bg-rose-600/40 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="glass p-20 text-center rounded-3xl">
          <div className="text-6xl mb-6 opacity-20">👤</div>
          <h3 className="text-xl font-bold text-slate-300">No Personnel Found</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">No drivers match your search query or the roster is empty.</p>
        </div>
      ) : (
        <div className="table-container animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-4">Personnel Information</th>
                  <th className="px-6 py-4">License Credential</th>
                  <th className="px-6 py-4">License Validity</th>
                  <th className="px-6 py-4">Duty Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((d) => (
                  <tr key={d._id} className="table-row group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-sm">
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{d.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">EMP-{d._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-sm text-slate-400">{d.licenseNumber}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${new Date(d.licenseExpiry) < new Date() ? 'text-red-400' : 'text-slate-300'}`}>
                          {new Date(d.licenseExpiry).toLocaleDateString()}
                        </span>
                        {new Date(d.licenseExpiry) < new Date() && (
                          <span className="text-[10px] font-bold text-red-500/80 uppercase">Expired</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {can(role, "changeDriverStatus") ? (
                        <select 
                          value={d.status} 
                          onChange={(e) => handleStatusChange(d._id, e.target.value)} 
                          className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer border-b border-transparent hover:border-indigo-500/50 transition-all p-1"
                        >
                          <option value="AVAILABLE" className="bg-slate-900">Available</option>
                          <option value="ON_TRIP" className="bg-slate-900">Deployed</option>
                          <option value="SUSPENDED" className="bg-slate-900">Suspended</option>
                        </select>
                      ) : (
                        <StatusPill status={d.status} />
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                        {can(role, "addDriver") && (
                          <button onClick={() => handleEdit(d)} className="p-2 hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition" title="Edit Profile">
                            ✏️
                          </button>
                        )}
                        {can(role, "deleteDriver") && (
                          <button onClick={() => handleDelete(d._id, d.name)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition" title="Remove Personnel">
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

      {/* Driver Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={resetForm} 
        title={editingId ? "Update Employee Data" : "New Personnel Enrollment"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Legal Full Name</label>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="input-field w-full" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">License Number</label>
              <input 
                type="text" 
                placeholder="License Number" 
                value={form.licenseNumber} 
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} 
                className="input-field w-full" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">License Expiry Date</label>
              <input 
                type="date" 
                value={form.licenseExpiry} 
                onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} 
                className="input-field w-full" 
                required 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={resetForm} className="btn-secondary flex-1">Abort</button>
            <button type="submit" className="btn-primary flex-1">{editingId ? "Save Profile" : "Onboard Personnel"}</button>
          </div>
        </form>
      </Modal>

      {/* Leave Request Modal */}
      <Modal 
        isOpen={showLeaveModal} 
        onClose={() => setShowLeaveModal(false)} 
        title="File Leave Request"
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Driver</label>
              <select 
                value={leaveForm.driverId} 
                onChange={(e) => setLeaveForm({ ...leaveForm, driverId: e.target.value })} 
                className="input-field w-full"
                required
              >
                <option value="">Select Driver</option>
                {drivers.map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
              <input 
                type="date" 
                value={leaveForm.startDate} 
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} 
                className="input-field w-full" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
              <input 
                type="date" 
                value={leaveForm.endDate} 
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} 
                className="input-field w-full" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Reason</label>
              <textarea 
                placeholder="Reason for leave" 
                value={leaveForm.reason} 
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} 
                className="input-field w-full min-h-[100px] py-3" 
                required 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowLeaveModal(false)} className="btn-secondary flex-1">Abort</button>
            <button type="submit" className="btn-primary flex-1">Submit Request</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Drivers;