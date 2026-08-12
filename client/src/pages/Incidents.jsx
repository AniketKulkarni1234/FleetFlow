// client/src/pages/Incidents.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import StatusPill from "../components/StatusPill";

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: "Accident", vehicle: "", driver: "", severity: "Medium", description: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, vehRes, driRes] = await Promise.all([
        API.get("/api/incidents"),
        API.get("/api/vehicles"),
        API.get("/api/drivers"),
      ]);
      setIncidents(incRes.data);
      setVehicles(vehRes.data);
      setDrivers(driRes.data);
    } catch (err) {
      toast.error("Failed to load safety data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/incidents", form);
      toast.success("Incident reported and logged");
      setShowModal(false);
      setForm({ type: "Accident", vehicle: "", driver: "", severity: "Medium", description: "" });
      fetchData();
    } catch (err) {
      toast.error("Failed to submit report");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/api/incidents/${id}/status`, { status });
      toast.success("Incident status updated");
      fetchData();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Safety & Compliance</h1>
          <p className="text-slate-400 mt-1">Audit trail for accidents and safety violations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary bg-amber-600 hover:bg-amber-500 flex items-center gap-2">
          <span>⚠️</span> Report Incident
        </button>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass p-5 rounded-2xl border-l-4 border-rose-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Reported Incidents</p>
          <p className="text-3xl font-extrabold text-white">{incidents.length}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Cases / Under Review</p>
          <p className="text-3xl font-extrabold text-amber-400">{incidents.filter(i => i.status !== 'RESOLVED').length}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-emerald-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Resolved Safety Cases</p>
          <p className="text-3xl font-extrabold text-emerald-400">{incidents.filter(i => i.status === 'RESOLVED').length}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-blue-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Fleet Compliance Score</p>
          <p className="text-3xl font-extrabold text-blue-400">98%</p>
        </div>
      </div>


      {loading ? <div className="skeleton h-60 w-full"></div> : incidents.length === 0 ? (
        <div className="glass p-20 text-center rounded-3xl opacity-50 font-bold text-slate-500">
          No incidents reported. System is operating within safety parameters.
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-4">Event Details</th>
                <th className="px-6 py-4">Assets Involved</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {incidents.map(i => (
                <tr key={i._id} className="table-row group">
                  <td className="px-6 py-5">
                    <p className="font-bold text-white uppercase text-sm tracking-tight">{i.type}</p>
                    <p className="text-xs text-slate-500 mt-1">{i.description}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-300">🚛 {i.vehicle?.name}</p>
                    <p className="text-xs font-bold text-slate-300 mt-1">👤 {i.driver?.name}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-800 ${
                      i.severity === 'Critical' ? 'text-red-500' : 
                      i.severity === 'High' ? 'text-orange-500' : 'text-amber-500'
                    }`}>
                      {i.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <select value={i.status} onChange={e => updateStatus(i._id, e.target.value)} className="bg-transparent text-xs font-bold focus:outline-none border-b border-white/10">
                      <option value="REPORTED" className="bg-slate-900">Reported</option>
                      <option value="INVESTIGATING" className="bg-slate-900">Investigating</option>
                      <option value="RESOLVED" className="bg-slate-900">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500 text-right">
                    {new Date(i.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Operational Incident Report">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field w-full">
                <option value="Accident">Accident</option>
                <option value="Overspeed">Overspeed</option>
                <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                <option value="Driver Fatigue">Driver Fatigue</option>
                <option value="Mechanical Failure">Mechanical Failure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Severity</label>
              <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="input-field w-full">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle</label>
              <select value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} className="input-field w-full" required>
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v._id} value={v._id} className="bg-slate-900">{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver</label>
              <select value={form.driver} onChange={e => setForm({...form, driver: e.target.value})} className="input-field w-full" required>
                <option value="">Select Driver</option>
                {drivers.map(d => <option key={d._id} value={d._id} className="bg-slate-900">{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description of Incident</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field w-full h-24 pt-3" placeholder="Enter detailed description..." required />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Abort</button>
            <button type="submit" className="btn-primary flex-1 bg-amber-600 hover:bg-amber-500">File Report</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Incidents;
