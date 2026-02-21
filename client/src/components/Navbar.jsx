// client/src/components/Navbar.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="w-full h-14 bg-slate-800 text-white flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="lg:hidden text-xl">☰</button>
        <h1 className="text-xl font-semibold">FleetFlow 🚚</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-xs bg-blue-600 px-2 py-1 rounded-full font-medium">{role}</span>
        <Link to="/profile" className="hover:text-blue-300 text-sm transition">👤 Profile</Link>
        <button onClick={handleLogout} className="bg-red-500 px-4 py-1 rounded hover:bg-red-600 text-sm font-medium transition">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;