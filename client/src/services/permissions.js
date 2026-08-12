// client/src/services/permissions.js

// Define which roles can access which routes
const routePermissions = {
  "/dashboard": ["Manager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst", "Driver"],
  "/vehicles": ["Manager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst"],
  "/drivers": ["Manager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst"],
  "/trips": ["Manager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst", "Driver"],
  "/maintenance": ["Manager", "SafetyOfficer"],
  "/expenses": ["Manager", "FinancialAnalyst"],
  "/analytics": ["Manager", "FinancialAnalyst"],
  "/profile": ["Manager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst", "Driver"],
  "/users": ["Manager"],
  "/incidents": ["Manager", "SafetyOfficer"],
  "/tracking": ["Manager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst", "Driver"],
  "/schedule": ["Manager", "Dispatcher"],
  "/finance": ["Manager", "FinancialAnalyst"],
  "/fuel": ["Manager", "Dispatcher", "FinancialAnalyst", "Driver"],
};

// Generic check for route access
export const isRouteAllowed = (role, path) => {
  if (!role) return false;
  const allowed = routePermissions[path];
  if (!allowed) return true; // if route not listed, allow by default
  return allowed.includes(role);
};

// Example action permissions (can expand as needed)
const actionPermissions = {
  addVehicle: ["Manager", "Dispatcher"],
  deleteVehicle: ["Manager"],
  changeVehicleStatus: ["Manager", "Dispatcher"],
  addDriver: ["Manager"],
  deleteDriver: ["Manager"],
  changeDriverStatus: ["Manager", "Dispatcher"],
  addMaintenance: ["Manager", "SafetyOfficer"],
  deleteMaintenance: ["Manager"],
  addExpense: ["Manager", "FinancialAnalyst"],
  deleteExpense: ["Manager"],
  createTrip: ["Manager", "Dispatcher"],
  completeTrip: ["Manager", "Dispatcher"],
  cancelTrip: ["Manager", "Dispatcher"],
  manageUsers: ["Manager"],
  reportIncident: ["Manager", "SafetyOfficer"],
};

export const can = (role, action) => {
  if (!role) return false;
  const allowed = actionPermissions[action];
  if (!allowed) return true; // unknown actions default to allowed
  return allowed.includes(role);
};

export default { isRouteAllowed, can };