// client/src/pages/Users.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import toast from "react-hot-toast";
import Modal from "../components/Modal";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Dispatcher" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/auth/users");
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this user?")) return;
    try {
      await API.delete(`/api/auth/users/${id}`);
      toast.success("User removed");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Action failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/auth/register", form);
      toast.success("New user account created");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "Dispatcher" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Creation failed");
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">User Administration</h1>
          <p className="text-slate-400 mt-1">Manage system access and role assignments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <span>👤+</span> Add New User
        </button>
      </div>

      {loading ? <div className="skeleton h-60 w-full"></div> : (
        <div className="table-container">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u._id} className="table-row group">
                  <td className="px-6 py-5 font-bold text-white">{u.name}</td>
                  <td className="px-6 py-5 text-slate-400">{u.email}</td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                      u.role === 'Manager' ? 'border-purple-500 text-purple-400' :
                      u.role === 'Dispatcher' ? 'border-blue-500 text-blue-400' :
                      u.role === 'SafetyOfficer' ? 'border-amber-500 text-amber-400' : 'border-emerald-500 text-emerald-400'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => handleDelete(u._id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create System User">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input-field w-full" required>
              <option value="Manager">Manager</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Driver">Driver</option>
              <option value="SafetyOfficer">Safety Officer</option>
              <option value="FinancialAnalyst">Financial Analyst</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create User</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Users;
