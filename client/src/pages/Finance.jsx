// client/src/pages/Finance.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import toast from "react-hot-toast";

const Finance = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [sumRes, repRes] = await Promise.all([
        API.get("/api/finance/summary"),
        API.get("/api/finance/reports"),
      ]);
      setSummaryData(sumRes.data.summary);
      setMonthlyReports(repRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Finance Ledger</h1>
            <p className="text-slate-400 text-sm mt-1">Audit cargo billings, driver salary payrolls, fuel & maintenance expenses</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchFinanceData}
              className="px-4 py-2.5 bg-slate-900 border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-500/20"
            >
              📊 Print Financial Report
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Trip Billing (Revenue) */}
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px] space-y-3 relative overflow-hidden group hover:border-blue-500/35 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                <span className="text-2xl">💵</span>
                <p className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Trip Billing (Revenues)</p>
                <h3 className="text-2xl font-black text-white">₹{(summaryData?.tripBilling || 0).toLocaleString()}</h3>
                <p className="text-[10px] text-green-400 font-medium">₹25.00/kg billing standard applied</p>
              </div>

              {/* Driver payroll */}
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px] space-y-3 relative overflow-hidden group hover:border-indigo-500/35 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
                <span className="text-2xl">👤</span>
                <p className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Driver Salaries (Payroll)</p>
                <h3 className="text-2xl font-black text-white">₹{(summaryData?.totalDriverSalary || 0).toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 font-medium">Base Salary + ₹6.50/km run incentive</p>
              </div>

              {/* Operating Expenses */}
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px] space-y-3 relative overflow-hidden group hover:border-orange-500/35 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-orange-500/10 transition-colors"></div>
                <span className="text-2xl">⛽</span>
                <p className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Fuel & Maintenance Costs</p>
                <h3 className="text-2xl font-black text-white">
                  ₹{((summaryData?.fuelExpenses || 0) + (summaryData?.maintenanceExpenses || 0)).toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium flex gap-2">
                  <span>Fuel: ₹{(summaryData?.fuelExpenses || 0).toLocaleString()}</span>
                  <span>Maint: ₹{(summaryData?.maintenanceExpenses || 0).toLocaleString()}</span>
                </p>
              </div>

              {/* Profit Margin */}
              <div className={`bg-slate-900/40 border border-white/5 p-6 rounded-[24px] space-y-3 relative overflow-hidden group transition-all ${summaryData?.netProfit >= 0 ? "hover:border-green-500/35" : "hover:border-red-500/35"}`}>
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] pointer-events-none transition-colors ${summaryData?.netProfit >= 0 ? "bg-green-500/5 group-hover:bg-green-500/10" : "bg-red-500/5 group-hover:bg-red-500/10"}`}></div>
                <span className="text-2xl">{summaryData?.netProfit >= 0 ? "📈" : "📉"}</span>
                <p className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Net Profit / Loss</p>
                <h3 className={`text-2xl font-black ${summaryData?.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ₹{(summaryData?.netProfit || 0).toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Profit Margin: <span className="text-white font-bold">{summaryData?.profitMargin || 0}%</span></p>
              </div>
            </div>

            {/* Monthly Trend Bars */}
            <div className="bg-slate-900/20 border border-white/5 rounded-[32px] p-6 lg:p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Monthly Report Summaries</h3>
                  <p className="text-xs text-slate-500">Visual comparison of monthly revenues against operating expenses</p>
                </div>
              </div>

              <div className="space-y-4">
                {monthlyReports.map((report, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">{report.name}</p>
                        <p className="text-xs text-slate-500">Profit Margin: <span className="text-green-400 font-bold">{report.margin}%</span></p>
                      </div>
                      <div className="flex gap-4 text-xs font-semibold">
                        <div>
                          <span className="text-slate-500 block">Billing:</span>
                          <span className="text-white font-extrabold">₹{report.billing.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Expenses:</span>
                          <span className="text-orange-400 font-extrabold">₹{report.expenses.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Net Profit:</span>
                          <span className={`${report.profit >= 0 ? "text-green-400" : "text-red-400"} font-extrabold`}>
                            ₹{report.profit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bars representation */}
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                        <div
                          className="bg-blue-500 h-full rounded-l-full"
                          style={{
                            width: `${report.billing > 0 ? Math.min(100, (report.billing / (report.billing + report.expenses)) * 100) : 0}%`,
                          }}
                        ></div>
                        <div
                          className="bg-orange-500 h-full rounded-r-full"
                          style={{
                            width: `${report.expenses > 0 ? Math.min(100, (report.expenses / (report.billing + report.expenses)) * 100) : 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Billing Portion</span>
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Expenses Portion</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Finance;
