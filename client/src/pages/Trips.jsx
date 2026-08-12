// client/src/pages/Trips.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import API from "../services/api";
import toast from "react-hot-toast";
import { can } from "../services/permissions";

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Advanced Route optimization / suggestion states
  const [cities, setCities] = useState([]);
  const [estimation, setEstimation] = useState(null);
  const [recomVehicle, setRecomVehicle] = useState(null);

  const [form, setForm] = useState({
    vehicleId: "",
    driverId: "",
    cargoWeight: "",
    origin: "",
    destination: "",
    scheduledDate: "",
    notes: "",
    estimatedDistance: 0,
    estimatedFuelCost: 0
  });
  
  const [completeForm, setCompleteForm] = useState({ distance: "", fuelUsed: "" });
  const role = localStorage.getItem("role");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, driversRes, citiesRes] = await Promise.all([
        API.get("/api/trips"),
        API.get("/api/vehicles"),
        API.get("/api/drivers"),
        API.get("/api/routes/cities").catch(() => ({ data: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"] })),
      ]);
      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
      setCities(citiesRes.data || []);
    } catch (err) {
      toast.error("Failed to sync logistical data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // Recalculate route optimization details when origin/destination/cargo changes
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (form.origin && form.destination) {
        try {
          const estRes = await API.post("/api/routes/estimate", {
            origin: form.origin,
            destination: form.destination,
            cargoWeight: form.cargoWeight ? Number(form.cargoWeight) : 0
          });
          setEstimation(estRes.data);
          
          setForm(prev => ({
            ...prev,
            estimatedDistance: estRes.data.estimatedDistance,
            estimatedFuelCost: estRes.data.estimatedFuelCost
          }));

          // Get recommended vehicle
          if (form.cargoWeight) {
            const sugRes = await API.post("/api/routes/suggest-vehicle", {
              cargoWeight: Number(form.cargoWeight),
              estimatedDistance: estRes.data.estimatedDistance
            }).catch(() => null);
            
            if (sugRes && sugRes.data?.recommended) {
              setRecomVehicle(sugRes.data.recommended);
            } else {
              setRecomVehicle(null);
            }
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setEstimation(null);
        setRecomVehicle(null);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [form.origin, form.destination, form.cargoWeight]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!can(role, "createTrip")) return toast.error("Unauthorized action");
    
    // Check conflicts online
    if (form.scheduledDate) {
      try {
        const conflictRes = await API.post("/api/schedule/check-conflicts", {
          vehicleId: form.vehicleId,
          driverId: form.driverId,
          scheduledDate: form.scheduledDate
        });
        
        if (conflictRes.data.hasConflict) {
          const proceed = window.confirm(
            `Scheduling Conflict Detected:\n${conflictRes.data.conflicts.join("\n")}\n\nDo you want to override and create this manifest anyway?`
          );
          if (!proceed) return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    try {
      await API.post("/api/trips", form);
      toast.success("Trip manifest created as DRAFT");
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Manifest creation failed");
    }
  };

  const resetForm = () => {
    setForm({
      vehicleId: "",
      driverId: "",
      cargoWeight: "",
      origin: "",
      destination: "",
      scheduledDate: "",
      notes: "",
      estimatedDistance: 0,
      estimatedFuelCost: 0
    });
    setEstimation(null);
    setRecomVehicle(null);
  };

  const handleDispatch = async (id) => {
    try {
      await API.put(`/api/trips/${id}/dispatch`);
      toast.success("Trip DISPATCHED! Assets are now locked.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Dispatch failed");
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/api/trips/${selectedTrip._id}/complete`, completeForm);
      toast.success("Logistics cycle COMPLETED");
      setShowCompleteModal(false);
      setCompleteForm({ distance: "", fuelUsed: "" });
      setSelectedTrip(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Completion failed");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Abort this operation? Subordinated assets will be released.")) return;
    try {
      await API.put(`/api/trips/${id}/cancel`);
      toast.success("Operation ABORTED");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Cancellation failed");
    }
  };

  // Filter lists for only available units in creation form drop downs
  const availableVehicles = vehicles.filter(v => v.status === "AVAILABLE" || v._id === form.vehicleId);
  const availableDrivers = drivers.filter(d => d.status === "AVAILABLE" || d._id === form.driverId);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Logistics Deck</h1>
          <p className="text-slate-400 mt-1">Manage active deployments, schedule dispatch routes, optimize assets</p>
        </div>
        {can(role, "createTrip") && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <span>📡</span> Initialize New Manifest
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 skeleton w-full"></div>)}
        </div>
      ) : trips.length === 0 ? (
        <div className="glass p-20 text-center rounded-3xl">
          <div className="text-6xl mb-6 opacity-20">🗺️</div>
          <h3 className="text-xl font-bold text-slate-300">No Active Manifests</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">Initialize a new trip manifest to begin fleet deployment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {trips.map((t) => (
            <div key={t._id} className="glass group p-6 rounded-2xl hover:border-white/15 transition-all overflow-hidden relative">
              {/* Progress track */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                t.status === 'COMPLETED' ? 'bg-emerald-500' :
                t.status === 'DISPATCHED' ? 'bg-blue-500' :
                t.status === 'CANCELLED' ? 'bg-red-500' : 'bg-amber-500'
              }`}></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">ID: {t._id.slice(-8).toUpperCase()}</span>
                    <StatusPill status={t.status} />
                    {t.scheduledDate && (
                      <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Scheduled: {new Date(t.scheduledDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Route Heading */}
                  {t.origin && t.destination && (
                    <div className="text-lg font-bold text-white uppercase tracking-wide">
                      {t.origin} ➔ {t.destination}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-8">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🚛</div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Assigned Unit</p>
                        <p className="font-bold text-white">{t.vehicle?.name || "Unassigned"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">👤</div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Assigned Driver</p>
                        <p className="font-bold text-white">{t.driver?.name || "Unassigned"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📦</div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cargo Weight</p>
                        <p className="font-bold text-white">{t.cargoWeight.toLocaleString()} <span className="text-slate-400 font-normal">kg</span></p>
                      </div>
                    </div>
                    {(t.distance > 0 || t.estimatedDistance > 0) && (
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">📏</div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Route distance</p>
                          <p className="font-bold text-white">
                            {t.status === "COMPLETED" ? t.distance : t.estimatedDistance} <span className="text-slate-400 font-normal">km</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl border border-white/5 self-end lg:self-auto">
                  {t.status === "DRAFT" && can(role, "createTrip") && (
                    <button onClick={() => handleDispatch(t._id)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-600/20">
                      Dispatch Now
                    </button>
                  )}
                  {t.status === "DISPATCHED" && can(role, "completeTrip") && (
                    <button onClick={() => { setSelectedTrip(t); setShowCompleteModal(true); }} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/20">
                      Log Completion
                    </button>
                  )}
                  {t.status !== "COMPLETED" && t.status !== "CANCELLED" && can(role, "cancelTrip") && (
                    <button onClick={() => handleCancel(t._id)} className="p-2 text-red-500 hover:bg-red-400/10 rounded-xl transition" title="Abort Trip">
                      🚫
                    </button>
                  )}
                  {(t.status === "COMPLETED" || t.status === "CANCELLED") && (
                    <div className="text-center px-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Finalized on</p>
                      <p className="text-sm font-bold text-slate-300">{new Date(t.updatedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Initialize Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Initialize Logistics Manifest">
        <form onSubmit={handleCreateTrip} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Origin City</label>
              <input 
                type="text" 
                placeholder="e.g. Mumbai" 
                value={form.origin} 
                onChange={e => setForm({...form, origin: e.target.value})} 
                className="input-field w-full" 
                list="origin-list" 
                required 
              />
              <datalist id="origin-list">
                {cities.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Destination City</label>
              <input 
                type="text" 
                placeholder="e.g. Delhi" 
                value={form.destination} 
                onChange={e => setForm({...form, destination: e.target.value})} 
                className="input-field w-full" 
                list="dest-list" 
                required 
              />
              <datalist id="dest-list">
                {cities.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Cargo mass (kg)</label>
              <input 
                type="number" 
                placeholder="Enter cargo weight" 
                value={form.cargoWeight} 
                onChange={e => setForm({...form, cargoWeight: e.target.value})} 
                className="input-field w-full" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Scheduled Departure Date</label>
              <input 
                type="date" 
                value={form.scheduledDate} 
                onChange={e => setForm({...form, scheduledDate: e.target.value})} 
                className="input-field w-full" 
              />
            </div>
          </div>

          {/* Route Optimization Telemetry widget */}
          {estimation && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
              <p className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">📍 Route Optimization Predictions</p>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>🏁 Distance Estimate: <strong className="text-white">{estimation.estimatedDistance} km</strong></div>
                <div>⏱️ Transit Duration: <strong className="text-white">{estimation.estimatedDurationHours} hours</strong></div>
                <div className="col-span-2">⛽ Estimated Fuel: <strong className="text-emerald-400">₹{estimation.estimatedFuelCost.toLocaleString()}</strong> ({estimation.estimatedFuelLiters} L)</div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Assign Unit</label>
            <select className="input-field w-full" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} required>
              <option value="">Select Available Vehicle</option>
              {availableVehicles.map(v => (
                <option key={v._id} value={v._id} className="bg-slate-900">
                  {v.name} ({v.licensePlate}) — Cap: {v.maxCapacity}kg
                </option>
              ))}
            </select>
            {recomVehicle && (
              <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                💡 Recommended fit: {recomVehicle.vehicle?.name} (Utilized: {recomVehicle.utilizationPercent}%)
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Assign Dispatch Driver</label>
            <select className="input-field w-full" value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})} required>
              <option value="">Select Available Driver</option>
              {availableDrivers.map(d => (
                <option key={d._id} value={d._id} className="bg-slate-900">
                  {d.name} (Safety Score: {d.safetyScore})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Dispatch Instructions & Notes</label>
            <input 
              type="text" 
              placeholder="Driver instructions..." 
              value={form.notes} 
              onChange={e => setForm({...form, notes: e.target.value})} 
              className="input-field w-full" 
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Abort</button>
            <button type="submit" className="btn-primary flex-1">Register Manifest</button>
          </div>
        </form>
      </Modal>

      {/* Completion Modal */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Operational Debrief">
        <form onSubmit={handleComplete} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Total Distance (km)</label>
              <input type="number" placeholder="Distance" value={completeForm.distance} onChange={e => setCompleteForm({...completeForm, distance: e.target.value})} className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Fuel Consumption (L)</label>
              <input type="number" placeholder="Fuel used" value={completeForm.fuelUsed} onChange={e => setCompleteForm({...completeForm, fuelUsed: e.target.value})} className="input-field w-full" required />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowCompleteModal(false)} className="btn-secondary flex-1">Back</button>
            <button type="submit" className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-500">Seal Logbook</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Trips;