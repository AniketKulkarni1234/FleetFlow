// client/src/pages/Signup.jsx
import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Manager");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await API.post("/api/auth/register", { name, email, password, role });
      toast.success("Account created! Please login.");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <form className="bg-white p-8 rounded-xl shadow-2xl w-96" onSubmit={handleSubmit}>
        <div className="text-center mb-6">
          <span className="text-4xl">🚚</span>
          <h2 className="text-2xl font-bold mt-2 text-slate-800">Create Account</h2>
          <p className="text-sm text-gray-500">Join FleetFlow today</p>
        </div>
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 p-3 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 p-3 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 p-3 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 p-3 mb-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700" required>
          <option value="Manager">Manager</option>
          <option value="Dispatcher">Dispatcher</option>
          <option value="SafetyOfficer">Safety Officer</option>
          <option value="FinancialAnalyst">Financial Analyst</option>
        </select>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 transition">
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 hover:underline font-medium">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
