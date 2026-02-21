// client/src/pages/Analytics.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { exportToCSV } from "../services/exportCSV";
import toast from "react-hot-toast";

const Analytics = () => {
  const [fuelEfficiency, setFuelEfficiency] = useState(0);
  const [roiData, setRoiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/api/analytics/fuel").then((res) => setFuelEfficiency(res.data.fuelEfficiency)),
      API.get("/api/analytics/roi").then((res) => setRoiData(res.data)),
    ])
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportROI = () => {
    exportToCSV(roiData.map((r) => ({ Vehicle: r.vehicle, ROI: r.ROI })), "vehicle_roi");
    toast.success("Exported to CSV");
  };

  if (loading) return <Layout><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" /></div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-5">Analytics & Reports</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <h2 className="text-sm text-gray-500 font-medium">Avg Fuel Efficiency</h2>
          <p className="text-3xl font-bold text-slate-800 mt-2">{fuelEfficiency} <span className="text-base font-normal text-gray-400">km/L</span></p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <h2 className="text-sm text-gray-500 font-medium">Vehicles Tracked</h2>
          <p className="text-3xl font-bold text-slate-800 mt-2">{roiData.length}</p>
        </div>
      </div>

      {roiData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-700">Vehicle ROI</h2>
            <button onClick={handleExportROI} className="bg-slate-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm">📥 Export CSV</button>
          </div>
          <table className="min-w-full">
            <thead className="bg-slate-50 text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">ROI</th>
                <th className="px-4 py-3 text-left">Performance</th>
              </tr>
            </thead>
            <tbody>
              {roiData.map((item, i) => (
                <tr key={i} className="border-t text-sm hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{item.vehicle}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${Number(item.ROI) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.ROI}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${Number(item.ROI) >= 0 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.min(Math.abs(Number(item.ROI) * 50) + 10, 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {roiData.length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-gray-500">No analytics data yet. Add vehicles and expenses to see ROI.</p>
        </div>
      )}
    </Layout>
  );
};

export default Analytics;