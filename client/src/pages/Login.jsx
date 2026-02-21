// client/src/pages/Login.jsx
import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <form className="bg-white p-8 rounded-xl shadow-2xl w-96" onSubmit={handleSubmit}>
        <div className="text-center mb-6">
          <span className="text-4xl">🚚</span>
          <h2 className="text-2xl font-bold mt-2 text-slate-800">FleetFlow</h2>
          <p className="text-sm text-gray-500">Sign in to your account</p>
        </div>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 transition">
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline font-medium">Sign Up</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;