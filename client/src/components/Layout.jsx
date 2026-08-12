// client/src/components/Layout.jsx
import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          {/* Breadcrumbs fallback - could be a separate component */}
          <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
            {children}
          </div>
        </main>

        <footer className="py-6 border-t border-white/5 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} FleetFlow Management System • v1.0.0
        </footer>
      </div>
    </div>
  );
};

export default Layout;
