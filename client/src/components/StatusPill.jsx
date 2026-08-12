// client/src/components/StatusPill.jsx
import React from "react";

const statusColors = {
  AVAILABLE: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  ON_TRIP: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  IN_SHOP: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  RETIRED: "border-slate-500/30 text-slate-400 bg-slate-500/10",
  SUSPENDED: "border-rose-500/30 text-rose-400 bg-rose-500/10",
  DRAFT: "border-slate-500/30 text-slate-300 bg-slate-800/60",
  DISPATCHED: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  COMPLETED: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  CANCELLED: "border-rose-500/30 text-rose-400 bg-rose-500/10",
  PENDING: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  RESOLVED: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
};

const StatusPill = ({ status }) => {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
        statusColors[status] || "border-slate-700 text-slate-400 bg-slate-800/60"
      }`}
    >
      {status}
    </span>
  );
};

export default StatusPill;