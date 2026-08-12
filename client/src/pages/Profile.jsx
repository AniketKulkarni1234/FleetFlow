// client/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import toast from "react-hot-toast";

const Profile = () => {
  const [user, setUser] = useState({});
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/api/auth/profile")
      .then((res) => setUser(res.data))
      .catch((err) => console.log(err));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put("/api/auth/change-password", passwords);
      toast.success("Security credentials updated");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">Account Settings</h1>
        <p className="text-slate-400 mt-1">Manage your identity and security preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass p-8 rounded-3xl text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-4xl text-white font-bold mx-auto shadow-2xl shadow-blue-500/20 mb-6">
              {user.name?.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-widest mt-1">{user.role}</p>
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-200">{user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Registered</span>
                <span className="text-slate-200">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass p-8 rounded-3xl">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg text-lg">🔐</span>
              Security & Credentials
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Current Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter current password" 
                    value={passwords.currentPassword} 
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} 
                    className="input-field w-full" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Create new password" 
                    value={passwords.newPassword} 
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} 
                    className="input-field w-full" 
                    required 
                  />
                  <p className="text-[10px] text-slate-500 mt-2 ml-1">Minimum 6 characters required for compliance.</p>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary w-full py-3 text-lg font-bold"
              >
                {loading ? "Updating Security Layer..." : "Commit Credential Change"}
              </button>
            </form>
          </div>
          
          <div className="mt-8 glass p-8 rounded-3xl border-dashed">
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-4">Account Access Logs</h3>
            <p className="text-slate-500 text-sm">Access logging is enabled for this organizational account. Your recent activity is being audited for security compliance.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
