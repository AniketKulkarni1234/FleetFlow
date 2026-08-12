// client/src/pages/Schedule.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import API from "../services/api";
import toast from "react-hot-toast";

const Schedule = () => {
  const [scheduledTrips, setScheduledTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchResult, setDispatchResult] = useState(null);

  const fetchSchedule = async () => {
    try {
      const res = await API.get("/api/schedule");
      setScheduledTrips(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dispatch schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAutoDispatch = async () => {
    try {
      const res = await API.post("/api/schedule/auto-dispatch");
      const { dispatchedCount, msg, failures } = res.data;
      
      toast.success(msg || `Dispatched ${dispatchedCount} trips!`);
      
      if (failures && failures.length > 0) {
        setDispatchResult({ failures, count: dispatchedCount });
      } else {
        setDispatchResult({ count: dispatchedCount, failures: [] });
      }
      
      fetchSchedule();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Dispatch system error");
    }
  };

  // Group trips by scheduled date
  const groupedTrips = scheduledTrips.reduce((groups, trip) => {
    if (!trip.scheduledDate) return groups;
    const dateStr = new Date(trip.scheduledDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(trip);
    return groups;
  }, {});

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Automated Dispatch Engine</h1>
          <p className="text-slate-400 mt-1">Manage scheduled runs, run dispatch queues, resolve conflicts</p>
        </div>
        <button
          onClick={handleAutoDispatch}
          className="btn-primary bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          ⏰ Run Automated Dispatch
        </button>
      </div>

      {dispatchResult && (
        <div className="mb-8 glass p-6 rounded-2xl border-indigo-500/20 bg-indigo-500/5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Dispatch Queue Execution Results</h3>
            <button 
              onClick={() => setDispatchResult(null)} 
              className="text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-300">
            Successfully launched <strong className="text-emerald-400">{dispatchResult.count}</strong> trips into transit status.
          </p>
          {dispatchResult.failures.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Resource Scheduling Warnings:</p>
              <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1">
                {dispatchResult.failures.map((err, i) => (
                  <li key={i} className="text-rose-400 font-medium">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 skeleton w-full"></div>
          ))}
        </div>
      ) : scheduledTrips.length === 0 ? (
        <div className="glass p-20 text-center rounded-3xl">
          <div className="text-6xl mb-6 opacity-30">📅</div>
          <h3 className="text-xl font-bold text-slate-300">Schedule Ledger Clean</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            No futures dispatches coordinates scheduled. Create trips with specific planned scheduled dates to populate this timeline view.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedTrips).map((dateGroup) => (
            <div key={dateGroup} className="space-y-4">
              <h3 className="text-base font-bold text-slate-400 tracking-wider uppercase border-b border-white/5 pb-2">
                📆 {dateGroup}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupedTrips[dateGroup].map((trip) => {
                  const isConflict = trip.status === "DRAFT" && 
                    ((trip.vehicle && trip.vehicle.status !== "AVAILABLE") || 
                     (trip.driver && trip.driver.status !== "AVAILABLE"));

                  return (
                    <div 
                      key={trip._id} 
                      className={`glass p-5 rounded-2xl border transition-all ${
                        isConflict 
                          ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50" 
                          : "border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            TRP-{trip._id.slice(-6).toUpperCase()}
                          </h4>
                          <h3 className="font-bold text-slate-300 mt-0.5 text-base">
                            {trip.origin} ➔ {trip.destination}
                          </h3>
                        </div>
                        <StatusPill status={trip.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs mt-4 pt-3 border-t border-white/5 text-slate-400">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Planned Vehicle</span>
                          <span className={trip.vehicle?.status !== "AVAILABLE" && trip.status === "DRAFT" ? "text-rose-400 font-bold" : "text-slate-200"}>
                            🚛 {trip.vehicle?.name || "Suspended"} ({trip.vehicle?.status})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Assigned Crew</span>
                          <span className={trip.driver?.status !== "AVAILABLE" && trip.status === "DRAFT" ? "text-rose-400 font-bold" : "text-slate-200"}>
                            👤 {trip.driver?.name || "Suspended"} ({trip.driver?.status})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Est. Fuel Cost</span>
                          <span className="text-slate-200 font-semibold">₹{trip.estimatedFuelCost || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Cargo Mass</span>
                          <span className="text-slate-200 font-semibold">{trip.cargoWeight} kg</span>
                        </div>
                      </div>

                      {isConflict && (
                        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <span>⚠️</span> Resource Collision: Assigned vehicle or driver is currently unavailable.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Schedule;
