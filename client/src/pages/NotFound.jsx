import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>

      <div className="text-center max-w-md mx-auto relative z-10">
        <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tighter">
          404
        </h1>
        <h2 className="text-2xl font-bold text-white mt-6">
          Lost in Transit
        </h2>
        <p className="text-slate-400 mt-3 text-sm leading-relaxed">
          The page you are looking for has been re-routed, delayed, or does not exist in our flight schedule.
        </p>

        <div className="mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
