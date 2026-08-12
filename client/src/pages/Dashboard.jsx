// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import API from "../services/api";
import { Link } from "react-router-dom";

// Standard Stat Card
const StatCard = ({ icon, label, value, trend, colorClass }) => (
  <div className="glass p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:border-blue-500/30 group">
    <div className="flex justify-between items-start mb-3">
      <div className="w-11 h-11 rounded-xl bg-slate-800/90 border border-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 group-hover:border-blue-500/30 transition-all">
        {icon}
      </div>
      {trend && (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight group-hover:text-blue-300 transition-colors">{value}</p>
    <div className={`absolute bottom-0 left-0 w-full h-1 opacity-80 ${colorClass}`}></div>
  </div>
);


// Role components
const ManagerOverview = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    <StatCard icon="🚛" label="Total Fleet" value={stats.totalVehicles} colorClass="bg-blue-500" />
    <StatCard icon="⛽" label="Active Units" value={stats.onTripDrivers} colorClass="bg-cyan-500" />
    <StatCard icon="👤" label="Drivers" value={stats.totalDrivers} colorClass="bg-indigo-500" />
    <StatCard icon="📝" label="Drafts" value={stats.draftTrips} colorClass="bg-amber-500" />
    <StatCard icon="💰" label="Revenue" value={`₹${stats.totalRevenue?.toLocaleString()}`} colorClass="bg-emerald-500" />
    <StatCard icon="💸" label="Expenses" value={`₹${stats.totalExpenses?.toLocaleString()}`} colorClass="bg-rose-500" />
    <StatCard icon="📈" label="Profit" value={`₹${stats.profit?.toLocaleString()}`} colorClass="bg-green-500" />
    <StatCard icon="🔧" label="Maintenance" value={stats.maintenanceAlerts} colorClass="bg-orange-500" />
    <StatCard icon="🛡️" label="Safety Alerts" value={stats.incidentCount} colorClass="bg-red-500" />
    <StatCard icon="📊" label="Utilization" value={`${stats.utilizationRate}%`} colorClass="bg-slate-500" />
  </div>
);

const DispatcherOverview = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <StatCard icon="📝" label="Draft Trips" value={stats.draftTrips} colorClass="bg-amber-500" />
    <StatCard icon="📡" label="Active Trips" value={stats.dispatchedTrips} colorClass="bg-blue-500" />
    <StatCard icon="✅" label="Completed" value={stats.completedTrips} colorClass="bg-green-500" />
    <StatCard icon="🚛" label="Avail. Vehicles" value={stats.availableVehicles} colorClass="bg-cyan-500" />
    <StatCard icon="👤" label="Avail. Drivers" value={stats.availableDrivers} colorClass="bg-indigo-500" />
    <StatCard icon="⏰" label="SLA On-Time" value="94%" colorClass="bg-emerald-500" />
  </div>
);

const FinanceOverview = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard icon="💸" label="Accrued Costs" value={`₹${stats.totalExpenses?.toLocaleString()}`} colorClass="bg-rose-500" />
    <StatCard icon="📈" label="Avg Cost/Trip" value={`₹${stats.totalTrips > 0 ? Math.round(stats.totalExpenses/stats.totalTrips).toLocaleString() : 0}`} colorClass="bg-blue-500" />
    <StatCard icon="🔧" label="Main. Spend" value={`₹${stats.maintenanceSpend?.toLocaleString()}`} colorClass="bg-amber-500" />
    <StatCard icon="⛽" label="Fuel Spend" value={`₹${stats.fuelSpend?.toLocaleString()}`} colorClass="bg-indigo-500" />
  </div>
);

const SafetyOverview = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard icon="🚨" label="Incidents" value={stats.incidentCount} colorClass="bg-red-500" />
    <StatCard icon="🔧" label="Inspection Due" value={stats.maintenanceAlerts} colorClass="bg-amber-500" />
    <StatCard icon="🪪" label="License Alerts" value={stats.expiringLicenses} colorClass="bg-rose-500" />
    <StatCard icon="🛡️" label="Safety Score" value={`${stats.avgSafetyScore}%`} colorClass="bg-emerald-500" />
    <StatCard icon="📄" label="Expired Insurance" value={stats.expiredInsurance} colorClass="bg-orange-500" />
    <StatCard icon="📑" label="Expired Permits" value={stats.expiredPermits} colorClass="bg-cyan-500" />
    <StatCard icon="🚫" label="Expired Licenses" value={stats.expiredLicenses || 0} colorClass="bg-red-600" />
    <StatCard icon="👤" label="Suspended" value={stats.suspendedDrivers} colorClass="bg-slate-600" />
  </div>
);

const DriverOverview = ({ tripsCount, activeCount }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatCard icon="📋" label="My Assigned Trips" value={tripsCount} colorClass="bg-indigo-500" />
    <StatCard icon="📍" label="Active Shipments" value={activeCount} colorClass="bg-blue-500" />
    <StatCard icon="🛡️" label="Safety Compliance" value="98%" colorClass="bg-emerald-500" />
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [scheduledTrips, setScheduledTrips] = useState([]);
  const [driverTrips, setDriverTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = localStorage.getItem("role") || "Manager";

  const fetchDashboardData = async () => {
    try {
      const dashRes = await API.get("/api/dashboard");
      setStats(dashRes.data);

      const schedRes = await API.get("/api/trips/scheduled").catch(() => ({ data: [] }));
      setScheduledTrips(schedRes.data.slice(0, 5));

      if (role === "Driver") {
        // Find driver log to match user profile
        const driversListRes = await API.get("/api/drivers").catch(() => ({ data: [] }));
        const profileRes = await API.get("/api/auth/profile").catch(() => null);
        
        let matchingDriver = null;
        if (profileRes) {
          matchingDriver = driversListRes.data.find(d => d.user === profileRes.data?._id || d.name === profileRes.data?.name);
        }
        
        if (matchingDriver) {
          const drivTripsRes = await API.get(`/api/trips/driver/${matchingDriver._id}`).catch(() => ({ data: [] }));
          setDriverTrips(drivTripsRes.data);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  if (loading) return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[1,2,3,4].map(i => <div key={i} className="h-40 skeleton"></div>)}
      </div>
      <div className="h-96 skeleton"></div>
    </Layout>
  );

  const activeDriverTrips = driverTrips.filter(t => t.status === "DISPATCHED");

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">System Console</h1>
          <p className="text-slate-400 mt-1">Operational intelligence for {role} control</p>
        </div>
        <div className="flex gap-3">
          <Link to="/tracking" className="btn-secondary flex items-center justify-center gap-2">
            <span>📍</span> Tracking Map
          </Link>
          <Link to="/schedule" className="btn-primary flex items-center justify-center gap-2">
            <span>📅</span> Dispatch Schedule
          </Link>
        </div>
      </div>

      {/* Alerts Section */}
      {role !== "Driver" && (stats.expiringLicenses > 0 || stats.maintenanceAlerts > 0) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 flex items-center gap-4 animate-pulse">
          <div className="bg-red-500 p-2 rounded-lg text-white text-xl">🚨</div>
          <div className="flex-1">
            <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider">Critical System Alerts</h4>
            <p className="text-slate-300 text-sm">
              {stats.expiringLicenses} license(s) expiring soon and {stats.maintenanceAlerts} pending maintenance tasks require immediate attention.
            </p>
          </div>
          <Link to={role === "SafetyOfficer" ? "/drivers" : "/maintenance"} className="text-red-400 hover:underline text-sm font-bold">Resolve Now →</Link>
        </div>
      )}

      {/* Role Specific Overview */}
      <div className="mb-10">
        {role === "Manager" && <ManagerOverview stats={stats} />}
        {role === "Dispatcher" && <DispatcherOverview stats={stats} />}
        {role === "FinancialAnalyst" && <FinanceOverview stats={stats} />}
        {role === "SafetyOfficer" && <SafetyOverview stats={stats} />}
        {role === "Driver" && <DriverOverview tripsCount={driverTrips.length} activeCount={activeDriverTrips.length} />}
      </div>

      {role === "Driver" ? (
        // Driver Workspace View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Assigned Fleet Runs</h2>
            <div className="space-y-4">
              {driverTrips.length === 0 ? (
                <p className="text-sm text-slate-500">No trips have been assigned to you yet.</p>
              ) : (
                driverTrips.map((t) => (
                  <div key={t._id} className="p-4 rounded-xl border border-white/5 bg-slate-800/30 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-white uppercase">TRP-{t._id.slice(-6).toUpperCase()}</p>
                      <p className="text-slate-400 mt-1 font-semibold">{t.origin} ➔ {t.destination}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Payload: {t.cargoWeight} kg</p>
                    </div>
                    <div className="text-right space-y-2">
                      <StatusPill status={t.status} />
                      <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-4">Active Telemetry</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Your mobile or cockpit console location is feeding GPS coordinates back to dispatch tracking channels automatic. We advise following fuel-efficient lane speeds.
              </p>
            </div>
            {activeDriverTrips.length > 0 ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold text-center">
                📡 ACTIVE SHIPMENT REPORTING LIVE
              </div>
            ) : (
              <div className="p-4 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold text-center">
                STANDBY FOR DISPATCH ORDERS
              </div>
            )}
          </div>
        </div>
      ) : (
        // Standard Admin/Manager View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Operations</h2>
                <Link to="/trips" className="text-blue-400 text-sm hover:underline">View Logbook</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Route Path</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentTrips?.map((t) => (
                      <tr key={t._id} className="table-row group">
                        <td className="px-4 py-4 text-sm font-mono text-slate-400">TRP-{t._id.slice(-6).toUpperCase()}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">{t.vehicle?.name || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-400">
                          {t.origin && t.destination ? `${t.origin} ➔ ${t.destination}` : "N/A"}
                        </td>
                        <td className="px-4 py-4"><StatusPill status={t.status} /></td>
                        <td className="px-4 py-4 text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming Scheduled Trips List */}
            {scheduledTrips.length > 0 && (
              <div className="glass p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Planned Dispatches Queue</h2>
                  <Link to="/schedule" className="text-blue-400 text-sm hover:underline font-bold">Calendar Timeline →</Link>
                </div>
                <div className="space-y-4">
                  {scheduledTrips.map((s) => (
                    <div key={s._id} className="p-4 rounded-xl border border-white/5 bg-slate-900/40 flex justify-between items-center text-sm">
                      <div className="space-y-1">
                        <strong className="text-white block">{s.origin} ➔ {s.destination}</strong>
                        <span className="text-xs text-slate-500 font-mono">Unit: {s.vehicle?.name} | Crew: {s.driver?.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                          {new Date(s.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side Feed */}
          <div className="space-y-8">
            <div className="glass p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-6">Live Insights</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Fleet Occupancy</p>
                    <p className="text-2xl font-bold">{stats.utilizationRate}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 flex items-center justify-center text-[10px] font-bold animate-spin">
                    LIVE
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-4">Unit Allocation</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>In Transit</span>
                        <span>{stats.dispatchedTrips}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${(stats.dispatchedTrips/Math.max(1, stats.totalTrips))*100}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Completed</span>
                        <span>{stats.completedTrips}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(stats.completedTrips/Math.max(1, stats.totalTrips))*100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/20">
              <h3 className="font-bold mb-2">FleetFlow Route Optimizer</h3>
              <p className="text-sm text-slate-300">Automatic route estimates are calibrated against dynamic payload masses to minimize fuel costs.</p>
              <Link to="/tracking" className="mt-4 inline-block text-xs font-bold text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg">View Tracking Maps</Link>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;