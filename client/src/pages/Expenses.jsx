// client/src/pages/Expenses.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import toast from "react-hot-toast";
import { exportToCSV } from "../services/exportCSV";

const Expenses = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle: "", type: "FUEL", cost: "", liters: "" });
  const role = localStorage.getItem("role");

  const fetchVehicles = () => { API.get("/api/vehicles").then((res) => setVehicles(res.data)).catch(() => {}); };
  useEffect(() => { fetchVehicles(); }, []);

  const fetchExpenses = (vehicleId) => {
    if (!vehicleId) { setExpenses([]); setTotal(0); return; }
    API.get(`/api/expenses/${vehicleId}`).then((res) => setExpenses(res.data)).catch(() => {});
    API.get(`/api/expenses/${vehicleId}/total`).then((res) => setTotal(res.data.total)).catch(() => {});
  };

  const handleVehicleChange = (id) => { setSelectedVehicle(id); fetchExpenses(id); };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/expenses", { vehicle: form.vehicle, type: form.type, cost: Number(form.cost), liters: form.type === "FUEL" ? Number(form.liters) : 0 });
      setForm({ vehicle: "", type: "FUEL", cost: "", liters: "" });
      setShowForm(false);
      if (selectedVehicle) fetchExpenses(selectedVehicle);
      toast.success("Expense added");
    } catch (err) { toast.error(err.response?.data?.msg || "Failed to add expense"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await API.delete(`/api/expenses/${id}`); fetchExpenses(selectedVehicle); toast.success("Expense deleted"); }
    catch (err) { toast.error(err.response?.data?.msg || "Failed to delete"); }
  };

  const handleExport = () => {
    const data = expenses.map((e) => ({ Type: e.type, Cost: e.cost, Liters: e.liters || 0, Date: new Date(e.date).toLocaleDateString() }));
    exportToCSV(data, "expenses");
    toast.success("Exported to CSV");
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
        <div className="flex gap-2 flex-wrap">
          {expenses.length > 0 && <button onClick={handleExport} className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-sm">📥 Export CSV</button>}
          {(role === "Manager" || role === "FinancialAnalyst") && <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">{showForm ? "Cancel" : "+ Add Expense"}</button>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} className="border p-2.5 rounded-lg" required>
            <option value="">Select Vehicle</option>
            {vehicles.map((v) => (<option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>))}
          </select>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border p-2.5 rounded-lg" required>
            <option value="FUEL">Fuel</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <input type="number" placeholder="Cost (₹)" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="border p-2.5 rounded-lg" required />
          {form.type === "FUEL" && <input type="number" placeholder="Liters" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} className="border p-2.5 rounded-lg" />}
          <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium sm:col-span-2 lg:col-span-4">Save Expense</button>
        </form>
      )}

      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label className="font-medium text-sm text-slate-700">Filter by Vehicle:</label>
        <select value={selectedVehicle} onChange={(e) => handleVehicleChange(e.target.value)} className="border p-2.5 rounded-lg">
          <option value="">-- Select --</option>
          {vehicles.map((v) => (<option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>))}
        </select>
        {selectedVehicle && <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-semibold text-sm">Total: ₹{total.toLocaleString()}</span>}
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-gray-500">{selectedVehicle ? "No expenses for this vehicle." : "Select a vehicle to view expenses."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Cost</th>
                <th className="px-4 py-3 text-left">Liters</th>
                <th className="px-4 py-3 text-left">Date</th>
                {role === "Manager" && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id} className="border-t text-sm hover:bg-slate-50">
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${e.type === "FUEL" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{e.type}</span></td>
                  <td className="px-4 py-3 font-medium">₹{e.cost.toLocaleString()}</td>
                  <td className="px-4 py-3">{e.liters || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                  {role === "Manager" && <td className="px-4 py-3"><button onClick={() => handleDelete(e._id)} className="text-red-500 hover:text-red-700 text-xs">🗑️</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default Expenses;
