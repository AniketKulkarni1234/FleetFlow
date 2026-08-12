// client/src/pages/Signup.jsx
import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const ROLE_METADATA = [
  { value: "Manager", label: "Manager", icon: "💼", desc: "Oversee fleet operations, approvals & metrics" },
  { value: "Dispatcher", label: "Dispatcher", icon: "🗺️", desc: "Schedule trips, route assets & assign duties" },
  { value: "Driver", label: "Driver", icon: "🚛", desc: "View assigned routes, trips & leave statuses" },
  { value: "SafetyOfficer", label: "Safety Officer", icon: "🛡️", desc: "Log incident files & audits" },
  { value: "FinancialAnalyst", label: "Analyst", icon: "📊", desc: "Review expense margins & business KPIs" },
];

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Manager",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, role } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (roleValue) => {
    setFormData({ ...formData, role: roleValue });
  };

  const validate = () => {
    if (!name || !email || !password || !confirmPassword || !role) {
      toast.error("Please fill in all fields");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      await API.post("/api/auth/register", { 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        password, 
        role 
      });
      toast.success("Account created successfully! Please login.");
      navigate("/");
    } catch (err) {
      console.error("Signup error:", err);
      const errorMsg = err.response?.data?.msg || "Signup failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-950 overflow-y-auto py-10 px-4 relative font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse pointer-events-none delay-1000"></div>

      <div className="w-full max-w-2xl z-10">
        {/* Branding header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Create Administrative Account
          </h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Join request channels throughout the FleetFlow operation dashboard</p>
        </div>

        {/* Signup card */}
        <form 
          className="bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[32px] border border-white/5 shadow-[0_24px_64px_rgba(0,0,0,0.4)] space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  name="name"
                  placeholder="John Doe" 
                  value={name} 
                  onChange={handleChange} 
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                  required 
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <input 
                  type="email" 
                  name="email"
                  placeholder="john@company.com" 
                  value={email} 
                  onChange={handleChange} 
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                  required 
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input 
                  type="password" 
                  name="password"
                  placeholder="••••••••" 
                  value={password} 
                  onChange={handleChange} 
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                  required 
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={handleChange} 
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                  required 
                />
              </div>
            </div>
          </div>

          {/* Graphical Role Selector Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organizational Role</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ROLE_METADATA.map((r) => {
                const isSelected = role === r.value;
                return (
                  <div
                    key={r.value}
                    onClick={() => handleRoleSelect(r.value)}
                    className={`p-4 rounded-2xl cursor-pointer border text-left transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5 text-white"
                        : "border-white/5 bg-slate-950/30 hover:border-white/10 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{r.icon}</span>
                      <span className="text-sm font-bold">{r.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-550 hover:to-blue-555 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 active:scale-[0.99] transition-all disabled:opacity-50 duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Provisioning Account...</span>
              </div>
            ) : "Provision Access Profile"}
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500 font-medium">Already registered? </span>
            <Link to="/" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Access existing session console
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
