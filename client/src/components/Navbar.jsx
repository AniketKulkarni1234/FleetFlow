// client/src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("Manager");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role || "User");
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    toast.success("Successfully logged out. See you soon!");
    navigate("/");
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled ? "bg-slate-900/90 backdrop-blur-xl border-white/10 py-3 shadow-lg shadow-black/20" : "bg-transparent border-transparent py-5"}`}>
      <div className="max-w-[1600px] mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-800/80 text-slate-300 transition border border-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent">FleetFlow</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-blue-300 tracking-wide uppercase">{userRole} Control Center</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-100 leading-tight">{userRole}</p>
              <p className="text-[11px] text-slate-400 font-medium">Active Session</p>
            </div>
            
            <div className="relative group">
              <button className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/25 group-hover:scale-105 transition-all flex items-center justify-center border border-blue-400/30">
                {userRole.charAt(0)}
              </button>
              
              <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                <Link to="/profile" className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition font-medium">My Profile</Link>
                <div className="h-px bg-white/5 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;