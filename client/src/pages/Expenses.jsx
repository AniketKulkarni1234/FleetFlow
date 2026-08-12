// client/src/pages/Expenses.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import API from "../services/api";
import toast from "react-hot-toast";
import { exportToCSV } from "../services/exportCSV";
import { can } from "../services/permissions";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vehicle: "", type: "FUEL", cost: "", liters: "" });
  const role = localStorage.getItem("role");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, vehRes] = await Promise.all([
        API.get("/api/expenses"),
        API.get("/api/vehicles"),
      ]);
      setExpenses(expRes.data);
      setVehicles(vehRes.data);
    } catch (err) {
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!can(role, "addExpense")) return toast.error("Unauthorized action");
    if (!form.vehicle) return toast.error("Please select a target vehicle");

    try {
      const payload = {
        ...form,
        cost: Number(form.cost),
        liters: form.type === "FUEL" ? Number(form.liters) : 0
      };
      await API.post("/api/expenses", payload);
      toast.success("Expense record committed to ledger");
      setShowModal(false);
      setForm({ vehicle: "", type: "FUEL", cost: "", liters: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Commit failed");
    }
  };

  const handleDelete = async (id) => {
    if (!can(role, "deleteExpense")) return toast.error("Unauthorized action");
    if (!window.confirm("Void this financial record?")) return;
    try {
      await API.delete(`/api/expenses/${id}`);
      fetchData();
      toast.success("Record voided");
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const handleExport = () => {
    const data = expenses.map((e) => ({
      Vehicle: e.vehicle?.name,
      Type: e.type,
      Cost: e.cost,
      Liters: e.liters,
      Date: new Date(e.date).toLocaleDateString(),
    }));
    exportToCSV(data, "financial_ledger");
    toast.success("Ledger exported");
  };

  const totalSpend = expenses.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Financial Ledger</h1>
          <p className="text-slate-400 mt-1">Audit and manage operational expenditure</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleExport} className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2">
            <span>📥</span> Export Ledger
          </button>
          {can(role, "addExpense") && (
            <button onClick={() => setShowModal(true)} className="btn-primary bg-rose-600 hover:bg-rose-500 flex-1 md:flex-none flex items-center justify-center gap-2">
              <span>💸</span> Log Disbursement
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass p-6 rounded-2xl border-l-4 border-rose-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Accrued Opex</p>
          <p className="text-3xl font-bold text-white">₹{totalSpend.toLocaleString()}</p>
        </div>
        <div className="glass p-6 rounded-2xl border-l-4 border-blue-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Records</p>
          <p className="text-3xl font-bold text-white">{expenses.length}</p>
        </div>
        <div className="glass p-6 rounded-2xl border-l-4 border-emerald-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Average/Expense</p>
          <p className="text-3xl font-bold text-white">₹{expenses.length > 0 ? Math.round(totalSpend / expenses.length).toLocaleString() : 0}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 skeleton w-full"></div>)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass p-20 text-center rounded-3xl">
          <div className="text-6xl mb-6 opacity-20">💰</div>
          <h3 className="text-xl font-bold text-slate-300">No Records Found</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">The financial ledger is currently empty. Start logging disbursements to track OPEX.</p>
        </div>
      ) : (
        <div className="table-container shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Expense Type</th>
                  <th className="px-6 py-4">Accrued Amount</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map((e) => (
                  <tr key={e._id} className="table-row group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-800 border border-white/5`}>
                          {e.type === 'FUEL' ? '⛽' : '🔧'}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight">{e.vehicle?.name || "Suspended Unit"}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">TX-{e._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        e.type === 'FUEL' ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                      }`}>
                        {e.type} {e.liters > 0 && `(${e.liters}L)`}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-white text-lg">₹{e.cost.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {can(role, "deleteExpense") && (
                        <button onClick={() => handleDelete(e._id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition" title="Void Transaction">
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Operational Disbursement Log">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Asset Reference</label>
              <select className="input-field w-full" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} required>
                <option value="">Select Unit</option>
                {vehicles.map(v => <option key={v._id} value={v._id} className="bg-slate-900">{v.name} ({v.licensePlate})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Classification</label>
                <select className="input-field w-full" value={form.type} onChange={e => setForm({...form, type: e.target.value})} required>
                  <option value="FUEL">Fuel Refill</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Total Cost (₹)</label>
                <input type="number" placeholder="0.00" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="input-field w-full" required />
              </div>
            </div>
            {form.type === "FUEL" && (
              <div className="animate-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Volume (Liters)</label>
                <input type="number" placeholder="Enter volume" value={form.liters} onChange={e => setForm({...form, liters: e.target.value})} className="input-field w-full" required />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Abort</button>
            <button type="submit" className="btn-primary flex-1 bg-rose-600 hover:bg-rose-500">Commit Record</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Expenses;
