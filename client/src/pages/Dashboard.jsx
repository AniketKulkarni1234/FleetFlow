// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import API from "../services/api";

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/api/dashboard")
      .then((res) => setStats(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" /></div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-5">Dashboard</h1>

      {/* Alert banner */}
      {(stats.expiringLicenses > 0 || stats.maintenanceAlerts > 0) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg mb-5 text-sm flex items-center gap-2">
          ⚠️ <strong>{stats.expiringLicenses || 0}</strong> driver license(s) expiring within 30 days &nbsp;|&nbsp; <strong>{stats.maintenanceAlerts || 0}</strong> vehicle(s) in maintenance
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🚛" label="Total Vehicles" value={stats.totalVehicles || 0} color="#3b82f6" />
        <StatCard icon="🟢" label="Available Vehicles" value={stats.availableVehicles || 0} color="#22c55e" />
        <StatCard icon="🛣️" label="Active on Trip" value={stats.activeFleet || 0} color="#f59e0b" />
        <StatCard icon="🔧" label="In Maintenance" value={stats.maintenanceAlerts || 0} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="👤" label="Total Drivers" value={stats.totalDrivers || 0} color="#8b5cf6" />
        <StatCard icon="✅" label="Available Drivers" value={stats.availableDrivers || 0} color="#22c55e" />
        <StatCard icon="🗺️" label="Total Trips" value={stats.totalTrips || 0} color="#06b6d4" />
        <StatCard icon="✔️" label="Completed Trips" value={stats.completedTrips || 0} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon="📊" label="Utilization Rate" value={`${stats.utilizationRate || 0}%`} color="#6366f1" />
        <StatCard icon="💰" label="Total Expenses" value={`₹${(stats.totalExpenses || 0).toLocaleString()}`} color="#ec4899" />
        <StatCard icon="🚫" label="Suspended Drivers" value={stats.suspendedDrivers || 0} color="#dc2626" />
      </div>

      {/* Recent trips */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-3 text-slate-700">Recent Trips</h2>
        {stats.recentTrips && stats.recentTrips.length > 0 ? (
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Driver</th>
                <th className="pb-2">Cargo</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTrips.map((t) => (
                <tr key={t._id} className="border-b last:border-0 text-sm">
                  <td className="py-2">{t.vehicle?.name || "N/A"}</td>
                  <td className="py-2">{t.driver?.name || "N/A"}</td>
                  <td className="py-2">{t.cargoWeight} kg</td>
                  <td className="py-2"><StatusPill status={t.status} /></td>
                  <td className="py-2 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm">No trips yet</p>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;