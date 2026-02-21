// client/src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import toast from "react-hot-toast";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    API.get("/api/auth/profile")
      .then((res) => setUser(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    if (form.newPassword !== form.confirmPassword) return toast.error("Passwords do not match");
    try {
      const res = await API.put("/api/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success(res.data.msg);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPassword(false);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to change password");
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
        </div>
      </Layout>
    );

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-800 mb-5">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-xl mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Role</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{user?.role}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Member Since</span>
            <span className="text-slate-700">{new Date(user?.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="max-w-xl">
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium mb-4"
        >
          {showPassword ? "Cancel" : "🔒 Change Password"}
        </button>

        {showPassword && (
          <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            <input
              type="password"
              placeholder="Current Password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium w-full">
              Update Password
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
