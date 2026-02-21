// client/src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "📊 Dashboard" },
  { to: "/vehicles", label: "🚛 Vehicles" },
  { to: "/drivers", label: "👤 Drivers" },
  { to: "/trips", label: "🗺️ Trips" },
  { to: "/maintenance", label: "🔧 Maintenance" },
  { to: "/expenses", label: "💰 Expenses" },
  { to: "/analytics", label: "📈 Analytics" },
  { to: "/profile", label: "⚙️ Profile" },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}

      <div className={`fixed lg:static z-40 w-64 min-h-screen bg-slate-900 text-white p-5 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={onClose}
                className={`block px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                  pathname === link.to
                    ? "bg-blue-600 text-white shadow-lg"
                    : "hover:bg-slate-700 text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;