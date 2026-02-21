// client/src/components/StatusPill.jsx
import React from "react";

const statusColors = {
  AVAILABLE: "bg-green-100 text-green-700",
  ON_TRIP: "bg-blue-100 text-blue-700",
  IN_SHOP: "bg-yellow-100 text-yellow-700",
  RETIRED: "bg-gray-200 text-gray-700",
  SUSPENDED: "bg-red-100 text-red-700",
  DRAFT: "bg-slate-100 text-slate-700",
  DISPATCHED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
  FUEL: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
};

const StatusPill = ({ status }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        statusColors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

export default StatusPill;