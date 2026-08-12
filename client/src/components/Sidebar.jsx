// client/src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { isRouteAllowed } from "../services/permissions";

const links = [
  { to: "/dashboard", label: "📊 Dashboard" },
  { to: "/vehicles", label: "🚛 Vehicles" },
  { to: "/drivers", label: "👤 Drivers" },
  { to: "/trips", label: "🗺️ Trips" },
  { to: "/schedule", label: "📅 Dispatch Schedule" },
  { to: "/tracking", label: "📍 Live Tracking" },
  { to: "/maintenance", label: "🔧 Maintenance" },
  { to: "/expenses", label: "💰 Expenses" },
  { to: "/fuel", label: "⛽ Fuel Management" },
  { to: "/finance", label: "💵 Finance Ledger" },
  { to: "/analytics", label: "📈 Analytics" },
  { to: "/users", label: "👥 Users" },
  { to: "/incidents", label: "🛡️ Safety" },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
  const role = localStorage.getItem("role");

  // Filter links based on role permissions
  const allowedLinks = links.filter(link => isRouteAllowed(role, link.to));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />}

      <div className={`fixed lg:static z-40 w-64 min-h-screen bg-slate-900/95 border-r border-white/5 text-slate-100 p-5 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="mb-6 px-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Main Navigation</p>
        </div>
        <ul className="space-y-1">
          {allowedLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={onClose}
                className={`block px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  pathname === link.to
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-500/30 font-semibold"
                    : "hover:bg-slate-800/80 text-slate-400 hover:text-slate-100"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 mb-3 px-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account & Settings</p>
        </div>
        <ul>
          <li>
            <Link
              to="/profile"
              onClick={onClose}
              className={`block px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                pathname === "/profile"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-500/30 font-semibold"
                  : "hover:bg-slate-800/80 text-slate-400 hover:text-slate-100"
              }`}
            >
              ⚙️ Profile Settings
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;