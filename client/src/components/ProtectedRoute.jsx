// client/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isRouteAllowed } from "../services/permissions";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Check if role is allowed for this route
  const path = location.pathname;
  if (!isRouteAllowed(role, path)) {
    // If user is logged in but not allowed to access route, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;