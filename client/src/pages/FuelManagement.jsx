// client/src/pages/FuelManagement.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import API from "../services/api";
import toast from "react-hot-toast";
import { can } from "../services/permissions";

const FuelManagement = () => {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("entries");
  const [form, setForm] = useState({
    vehicleId: "",
    driverId: "",
    liters: "",
    costPerLiter: "",
    odometerReading: "",
    fuelStation: "",
    date: "",
  });

  const role = localStorage.getItem("role");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fuelRes, analyticsRes, vehRes, drvRes] = await Promise.all([
        API.get("/api/fuel"),
        API.get("/api/fuel/analytics"),
        API.get("/api/vehicles"),
        API.get("/api/drivers"),
      ]);
      setFuelEntries(fuelRes.data);
      setAnalytics(analyticsRes.data);
      setVehicles(vehRes.data);
      setDrivers(drvRes.data);
    } catch (err) {
      toast.error("Failed to load fuel management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId) return toast.error("Please select a vehicle");
    if (!form.liters || Number(form.liters) <= 0) return toast.error("Liters must be greater than 0");
    if (!form.costPerLiter || Number(form.costPerLiter) <= 0) return toast.error("Cost per liter must be greater than 0");
    if (!form.odometerReading || Number(form.odometerReading) < 0) return toast.error("A valid odometer reading is required");

    try {
      await API.post("/api/fuel", {
        vehicleId: form.vehicleId,
        driverId: form.driverId || undefined,
        liters: Number(form.liters),
        costPerLiter: Number(form.costPerLiter),
        odometerReading: Number(form.odometerReading),
        fuelStation: form.fuelStation,
        date: form.date || undefined,
      });
      toast.success("Fuel entry logged successfully");
      setShowModal(false);
      setForm({ vehicleId: "", driverId: "", liters: "", costPerLiter: "", odometerReading: "", fuelStation: "", date: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to log fuel entry");
    }
  };

  const totalLiters = fuelEntries.reduce((acc, f) => acc + (f.liters || 0), 0);
  const totalCost = fuelEntries.reduce((acc, f) => acc + (f.totalCost || 0), 0);
  const avgCostPerLiter = fuelEntries.length > 0
    ? (totalCost / totalLiters).toFixed(2)
    : 0;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Fuel Management</h1>
          <p className="text-slate-400 mt-1">Track refueling operations, mileage efficiency & fuel cost analytics</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {can(role, "createTrip") && (
            <button onClick={() => setShowModal(true)} className="btn-primary bg-emerald-600 hover:bg-emerald-500 flex-1 md:flex-none flex items-center justify-center gap-2">
              <span>⛽</span> Log Fuel Entry
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass p-5 rounded-2xl border-l-4 border-emerald-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Fuel Log Count</p>
          <p className="text-3xl font-extrabold text-white">{fuelEntries.length}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-blue-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Liters Consumed</p>
          <p className="text-3xl font-extrabold text-blue-400">{totalLiters.toLocaleString()} <span className="text-sm font-normal text-slate-400">L</span></p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-rose-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Fuel Spend</p>
          <p className="text-3xl font-extrabold text-rose-400">₹{totalCost.toLocaleString()}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Avg Cost / Liter</p>
          <p className="text-3xl font-extrabold text-amber-400">₹{avgCostPerLiter}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-slate-900 border border-slate-700/80 rounded-xl p-1.5 w-fit">
        <button
          onClick={() => setActiveTab("entries")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === "entries" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-white"}`}
        >
          ⛽ Fuel Refill Logs
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === "analytics" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:text-white"}`}
        >
          📊 Vehicle Mileage Analytics
        </button>
      </div>


      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 skeleton w-full"></div>)}
        </div>
      ) : activeTab === "entries" ? (
        /* Fuel Entries Table */
        fuelEntries.length === 0 ? (
          <div className="glass p-20 text-center rounded-3xl">
            <div className="text-6xl mb-6 opacity-20">⛽</div>
            <h3 className="text-xl font-bold text-slate-300">No Fuel Entries Yet</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Start logging refueling operations to track fuel consumption and mileage.</p>
          </div>
        ) : (
          <div className="table-container shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Liters</th>
                    <th className="px-6 py-4">Cost/L</th>
                    <th className="px-6 py-4">Total Cost</th>
                    <th className="px-6 py-4">Odometer</th>
                    <th className="px-6 py-4">Station</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fuelEntries.map((entry) => (
                    <tr key={entry._id} className="table-row group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-800 border border-white/5">⛽</div>
                          <div>
                            <p className="font-bold text-white">{entry.vehicle?.name || "Unknown"}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{entry.vehicle?.licensePlate || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-300">{entry.driver?.name || "—"}</td>
                      <td className="px-6 py-5 text-sm font-semibold text-white">{entry.liters} L</td>
                      <td className="px-6 py-5 text-sm text-slate-300">₹{entry.costPerLiter}</td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-emerald-400">₹{entry.totalCost?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-400 font-mono">{entry.odometerReading?.toLocaleString()} km</td>
                      <td className="px-6 py-5 text-sm text-slate-400">{entry.fuelStation || "—"}</td>
                      <td className="px-6 py-5 text-sm text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Vehicle Mileage Analytics */
        analytics.length === 0 ? (
          <div className="glass p-20 text-center rounded-3xl">
            <div className="text-6xl mb-6 opacity-20">📊</div>
            <h3 className="text-xl font-bold text-slate-300">No Analytics Available</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Log fuel entries to generate mileage and efficiency analytics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {analytics.map((item) => (
              <div key={item.vehicleId} className="glass p-6 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all group">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{item.licensePlate}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl border border-emerald-500/20">
                    🚛
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Mileage</span>
                    <span className="text-white font-bold">{item.mileage} km/L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Fuel Cost/km</span>
                    <span className="text-amber-400 font-bold">₹{item.fuelCostPerKm}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Refuels</span>
                    <span className="text-slate-200 font-semibold">{item.totalRefuelCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Liters</span>
                    <span className="text-slate-200 font-semibold">{item.totalLiters.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Fuel Spend</span>
                    <span className="text-rose-400 font-bold">₹{item.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Odometer</span>
                    <span className="text-slate-300 font-mono">{item.currentOdometer.toLocaleString()} km</span>
                  </div>
                </div>

                {/* Mileage indicator bar */}
                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Efficiency Index</span>
                    <span>{Math.min(100, Math.round(item.mileage * 10))}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.round(item.mileage * 10))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Fuel Entry Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Fuel Entry">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Vehicle *</label>
              <select className="input-field w-full" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v._id} value={v._id} className="bg-slate-900">{v.name} ({v.licensePlate}) — ODO: {v.odometer} km</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Driver (Optional)</label>
              <select className="input-field w-full" value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>
                <option value="">No Driver</option>
                {drivers.map(d => <option key={d._id} value={d._id} className="bg-slate-900">{d.name} ({d.licenseNumber})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Liters Filled *</label>
                <input type="number" step="0.1" placeholder="e.g. 45.5" value={form.liters} onChange={e => setForm({ ...form, liters: e.target.value })} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Cost per Liter (₹) *</label>
                <input type="number" step="0.01" placeholder="e.g. 95.50" value={form.costPerLiter} onChange={e => setForm({ ...form, costPerLiter: e.target.value })} className="input-field w-full" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Odometer Reading (km) *</label>
              <input type="number" placeholder="Current odometer reading" value={form.odometerReading} onChange={e => setForm({ ...form, odometerReading: e.target.value })} className="input-field w-full" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Fuel Station</label>
                <input type="text" placeholder="Station name" value={form.fuelStation} onChange={e => setForm({ ...form, fuelStation: e.target.value })} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field w-full" />
              </div>
            </div>
            {/* Auto computed total */}
            {form.liters && form.costPerLiter && (
              <div className="glass p-4 rounded-xl text-center animate-in fade-in">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Estimated Total Cost</p>
                <p className="text-2xl font-extrabold text-emerald-400">₹{(Number(form.liters) * Number(form.costPerLiter)).toLocaleString()}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-500">Log Fuel Entry</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default FuelManagement;
