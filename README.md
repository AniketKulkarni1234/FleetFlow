# 🚚 FleetFlow — Smart Logistics Management System

FleetFlow is a production-grade, full-stack logistics and fleet management platform built using a modern **Model-View-Controller (MVC)** architecture coupled with a dedicated **Service Layer**. It powers real-time telemetry tracking, trip dispatching, driver safety monitoring, financial ledgering, document compliance, and multi-role RBAC authorization for fleet operations.

---

## 📑 Table of Contents
- [✨ Major System Features](#-major-system-features)
- [🏛️ System Architecture](#️-system-architecture)
- [📁 Directory Structure](#-directory-structure)
- [🛠️ Tech Stack & Dependencies](#️-tech-stack--dependencies)
- [🔒 Environment Configuration](#-environment-configuration)
- [🔑 Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [📡 REST API Endpoints Reference](#-rest-api-endpoints-reference)
- [⚡ Quickstart & Setup Guide](#-quickstart--setup-guide)
- [📈 Analytics & Export Features](#-analytics--export-features)

---

## ✨ Major System Features

### 1. 🛰️ Real-Time Telemetry & Live GPS Tracking
- **Live Socket.IO Stream:** Broadcasts real-time vehicle GPS coordinates, speed (km/h), fuel level (%), engine status, and sensor alerts directly to the frontend.
- **Interactive Fleet Map:** OpenStreetMap / Leaflet map rendering active vehicle positions, route paths, and status markers.
- **Telemetry Simulation Engine:** Integrated backend background process simulating live vehicle telemetry updates when vehicles are on active trips.

### 2. 🚛 Vehicle & Fleet Asset Management
- Comprehensive asset management tracking vehicle type, license plate, VIN, make/model, fuel capacity, status (`Active`, `In Maintenance`, `Inactive`, `In Transit`), total mileage, and assigned driver.
- Real-time status toggling and maintenance lifecycle tracking.

### 3. 👨‍✈️ Driver Roster & Safety Performance
- Complete driver records including license numbers, expirations, contact details, assigned vehicle, experience level, and duty status (`Available`, `On Duty`, `On Leave`, `Suspended`).
- Dynamic Safety Scorecard system evaluating driver performance and safety compliance.

### 4. 📦 Trip Scheduling, Dispatch & Route Optimization
- End-to-end trip lifecycle management: `Scheduled` ➔ `In Transit` ➔ `Completed` / `Cancelled`.
- **Route Estimation & Vehicle Suggestion:** Calculates route distance, estimated duration, fuel requirement, and suggests the optimal vehicle based on capacity and efficiency.
- **Automated Conflict Detection:** Prevents double-booking drivers or assigning vehicles currently under maintenance or on leave.

### 5. 🛠️ Maintenance & Inspection Tracking
- Logs preventive and corrective maintenance activities (`Routine Service`, `Engine Repair`, `Tire Replacement`, `Brake Inspection`, etc.).
- Cost breakdown, service center notes, and resolution workflow updating vehicle operational availability.

### 6. ⛽ Fuel Efficiency & Logging Engine
- Tracks fuel refilling records, cost per liter, fuel station locations, and total expenditure.
- Automatic MPG/KPL calculation and anomaly detection for unexpected fuel consumption spikes.

### 7. 💳 Financial Ledgering & Expense Tracking
- Multi-category expense management (`Fuel`, `Maintenance`, `Tolls`, `Insurance`, `Permits`, `Driver Allowance`).
- Consolidated financial summary reports calculating total fleet operating costs, revenue metrics, net margin, and cost per km.

### 8. ⚠️ Safety Incident & Compliance Vault
- Incident reporting system tracking accidents, traffic violations, delays, and vehicle breakdowns.
- Severity levels (`Low`, `Medium`, `High`, `Critical`), resolution tracking, and safety officer review workflow.

### 9. 📅 Driver Leave Management
- Driver leave request creation and managerial approval workflow.
- Integration with schedule conflict checking to ensure coverage during requested dates.

### 10. 🔍 Global Search & Filtering
- Instant workspace search across vehicles, drivers, trips, maintenance logs, and expenses.

---

## 🏛️ System Architecture

FleetFlow follows a clean, modular **MVC + Service Layer** pattern to ensure separation of concerns, testability, and high performance:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        View Layer (Client SPA)                         │
│             React 19 / Vite 5 / Tailwind CSS 3 / Recharts              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP Requests / WebSockets
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Routes & Middleware                             │
│       Express Routers / JWT Auth / Role Gatekeeper / Rate Limiter       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Controllers Layer                             │
│        HTTP Request Parsing, Input Validation, HTTP Status Codes       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            Service Layer                               │
│       Core Business Logic, Data Aggregation & Cross-Entity Rules       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           Models (Data)                                │
│                   Mongoose Schemas (MongoDB Storage)                   │
└────────────────────────────────────────────────────────────────────────┘
```

### Real-Time Telemetry Data Flow
```
┌──────────────────────────┐      Socket.IO Event      ┌──────────────────────────┐
│   Telemetry Simulation   ├──────────────────────────►│   Socket.IO Server Hub   │
│  Engine (utils/telemetry)│                           │       (server.js)        │
└──────────────────────────┘                           └────────────┬─────────────┘
                                                                    │ WebSocket Stream
                                                                    ▼
                                                       ┌──────────────────────────┐
                                                       │   Live Tracking Page     │
                                                       │  (Client Dashboard Map)  │
                                                       └──────────────────────────┘
```

---

## 📁 Directory Structure

```
FleetFlow-Team-NODEXA/
├── client/                     # Frontend View Layer (React SPA)
│   ├── public/                 # Static Assets & Icons
│   ├── src/                    # Client Source Code
│   │   ├── components/         # UI Components (Layout, Navbar, Sidebar, Modal, StatusPill, ProtectedRoute)
│   │   ├── pages/              # View Pages (Dashboard, LiveTracking, Vehicles, Drivers, Trips, Maintenance, Expenses, Fuel, Finance, Incidents, Schedule, Users, Profile, Analytics)
│   │   ├── services/           # Axios API Client, Permissions Matrix Engine, CSV Exporter
│   │   ├── App.jsx             # Main Router & Route Protection
│   │   ├── main.jsx            # React 19 DOM Root Initialization
│   │   └── index.css           # Global Tailwind CSS Custom Rules
│   ├── index.html              # HTML Entry Point
│   ├── package.json            # Client Dependencies & Scripts
│   ├── tailwind.config.js      # Tailwind CSS Theme & Styling Config
│   └── vite.config.js          # Vite Server Config (loads root .env)
│
├── server/                     # Backend Controller/Service Layer (Node.js/Express)
│   ├── controllers/            # Controller Modules (Request/Response Logic)
│   ├── middleware/             # Auth Token Verification, RBAC Enforcement, Rate Limiting, Error Handlers
│   ├── models/                 # Mongoose Schemas (User, Vehicle, Driver, Trip, Maintenance, FuelEntry, Expense, Incident, LeaveRequest)
│   ├── routes/                 # Express Route Definitions (15 Domain Routers)
│   ├── services/               # Business Logic & Database Abstractions
│   ├── utils/                  # Telemetry Engine & Socket Helper
│   ├── package.json            # Server Dependencies & Scripts
│   ├── seed.js                 # Database Seeding Engine
│   └── server.js               # Express Server & Socket.IO Entry Point
│
├── docs/                       # Project Documentation & Architecture Guides
│   ├── PROJECT_ACTIVITY_GUIDE.md # Detailed Development History & Milestones
│   ├── PROJECT_ANALYSIS.md       # Comprehensive Technical & Architectural Analysis
│   └── ROLE_FEATURES.md          # Multi-Role RBAC Permissions Blueprint
│
├── .env                        # Single Consolidated Environment Config
├── package.json                # Monorepo Root Package (Workspaces Setup)
├── package-lock.json           # Monorepo Dependency Lockfile
└── README.md                   # Project Documentation
```

---

## 🛠️ Tech Stack & Dependencies

### Frontend (Client)
- **Framework & Build:** [React 19](https://react.dev/), [Vite 5](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/), PostCSS, Autoprefixer
- **Routing:** [React Router DOM 7](https://reactrouter.com/)
- **State & Data Fetching:** [Axios](https://axios-http.com/)
- **Real-Time WebSockets:** `socket.io-client` (v4.8)
- **Data Visualization:** [Recharts](https://recharts.org/) (v2.15)
- **UI Notifications:** `react-hot-toast`

### Backend (Server)
- **Runtime & Framework:** [Node.js](https://nodejs.org/), [Express.js 4](https://expressjs.com/)
- **Database & ODM:** [MongoDB](https://www.mongodb.com/), [Mongoose 8](https://mongoosejs.com/)
- **Real-Time Communication:** [Socket.IO 4](https://socket.io/)
- **Authentication & Security:** `jsonwebtoken` (JWT), `bcryptjs`, `express-rate-limit`, `cors`
- **Environment & Utilities:** `dotenv`

### Monorepo Workspaces
- `concurrently` for parallel client/server execution
- Single consolidated `.env` configuration file architecture

---

## 🔒 Environment Configuration

FleetFlow uses a single environment file at the root: `FleetFlow-Team-NODEXA/.env`.

```env
# Server Configuration (Backend Private)
PORT=
MONGO_URI=
JWT_SECRET=
CLIENT_URL=
NODE_ENV=development

# Client Configuration (Exposed to Vite bundle with VITE_ prefix)
VITE_API_URL=http://localhost:5000/api
```

- **Server Loading:** Loaded via `require("dotenv").config({ path: path.resolve(__dirname, "../.env") })`.
- **Client Loading:** Loaded in `vite.config.js` via `envDir: path.resolve(__dirname, "..")`.
- **Security:** Variables without the `VITE_` prefix remain completely invisible to the frontend JavaScript bundle.

---

## 🔑 Role-Based Access Control (RBAC)

All accounts share the default password: **`password123`**

### Pre-Configured Test Accounts

| Role | Email | Key Operational Scope |
| :--- | :--- | :--- |
| 👑 **Manager** | `manager@fleetflow.com` | Full administrative control, driver/vehicle creation, financial reports, user management |
| 🎯 **Dispatcher** | `dispatcher@fleetflow.com` | Live route dispatching, trip scheduling, vehicle status updates, fuel entry |
| 🛡️ **Safety Officer** | `safety@fleetflow.com` | Safety score audits, incident logging & resolution, maintenance scheduling |
| 💰 **Financial Analyst** | `finance@fleetflow.com` | Cost allocation, expense logging, P&L reporting, fuel analytics |
| 🚚 **Driver** | `driver@fleetflow.com` | Assigned trip logs, schedule viewing, leave request creation |

---

## 📡 REST API Endpoints Reference

### 1. 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/profile` | Authenticated | Retrieve authenticated user profile |
| `PUT` | `/api/auth/change-password` | Authenticated | Update user password |
| `GET` | `/api/auth/users` | Manager | List all registered user accounts |
| `DELETE` | `/api/auth/users/:id` | Manager | Delete user account |

### 2. 🚛 Vehicles (`/api/vehicles`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vehicles` | Authenticated | Retrieve all fleet vehicles |
| `POST` | `/api/vehicles` | Manager, Dispatcher | Add a new vehicle to fleet |
| `PUT` | `/api/vehicles/:id` | Manager | Update vehicle details |
| `PUT` | `/api/vehicles/:id/status` | Manager, Dispatcher | Update vehicle operational status |
| `DELETE` | `/api/vehicles/:id` | Manager | Remove vehicle from fleet |

### 3. 👨‍✈️ Drivers (`/api/drivers`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/drivers` | Authenticated | Retrieve driver roster |
| `POST` | `/api/drivers` | Manager | Register new driver |
| `PUT` | `/api/drivers/:id` | Manager | Update driver details & safety score |
| `PUT` | `/api/drivers/:id/status` | Manager, Dispatcher | Update driver duty status |
| `DELETE` | `/api/drivers/:id` | Manager | Remove driver record |

### 4. 📦 Trips (`/api/trips`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/trips` | Authenticated | Get all trips |
| `GET` | `/api/trips/active` | Authenticated | Get currently active trips |
| `GET` | `/api/trips/scheduled` | Authenticated | Get upcoming scheduled trips |
| `GET` | `/api/trips/driver/:driverId` | Authenticated | Get trips assigned to specific driver |
| `POST` | `/api/trips` | Manager, Dispatcher | Create new trip schedule |
| `PUT` | `/api/trips/:id/dispatch` | Manager, Dispatcher | Dispatch scheduled trip |
| `PUT` | `/api/trips/:id/complete` | Manager, Dispatcher | Mark trip as completed |
| `PUT` | `/api/trips/:id/cancel` | Manager, Dispatcher | Cancel trip |

### 5. 🛠️ Maintenance (`/api/maintenance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenance` | Authenticated | Get maintenance history logs |
| `POST` | `/api/maintenance` | Manager, SafetyOfficer | Log new maintenance activity |
| `PUT` | `/api/maintenance/:id/resolve` | Manager, SafetyOfficer | Mark maintenance issue as resolved |
| `DELETE` | `/api/maintenance/:id` | Manager | Delete maintenance record |

### 6. ⛽ Fuel Management (`/api/fuel`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fuel` | Authenticated | Get all fuel refill logs |
| `GET` | `/api/fuel/analytics` | Authenticated | Retrieve fuel efficiency & cost analytics |
| `POST` | `/api/fuel` | Manager, Dispatcher | Create fuel refill record |

### 7. 💳 Expenses (`/api/expenses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/expenses` | Authenticated | Get all fleet expenses |
| `GET` | `/api/expenses/:id` | Authenticated | Get expenses by vehicle ID |
| `GET` | `/api/expenses/:id/total` | Authenticated | Get total expense sum for vehicle |
| `POST` | `/api/expenses` | Manager, FinancialAnalyst | Log new fleet expense |
| `DELETE` | `/api/expenses/:id` | Manager | Delete expense entry |

### 8. 📊 Dashboard & Analytics (`/api/dashboard`, `/api/analytics`, `/api/finance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Authenticated | Summary stats for top dashboard KPIs |
| `GET` | `/api/analytics` | Authenticated | Consolidated fleet analytics report |
| `GET` | `/api/analytics/delivery-performance` | Authenticated | Delivery SLA & performance metrics |
| `GET` | `/api/analytics/driver-performance` | Authenticated | Driver rating & mileage breakdown |
| `GET` | `/api/analytics/utilization-trend` | Authenticated | Vehicle utilization trend over time |
| `GET` | `/api/finance/summary` | Authenticated | Executive financial summary |
| `GET` | `/api/finance/reports` | Manager, FinancialAnalyst | Monthly financial & ROI reports |

### 9. ⚠️ Incidents (`/api/incidents`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/incidents` | Authenticated | Get safety incident logs |
| `POST` | `/api/incidents` | Manager, SafetyOfficer | Report new safety incident |
| `PUT` | `/api/incidents/:id/status` | Manager, SafetyOfficer | Update incident status |

### 10. 🗺️ Routes & Scheduling (`/api/routes`, `/api/schedule`, `/api/leaves`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/routes/cities` | Authenticated | Get supported route cities |
| `GET` | `/api/routes/history` | Authenticated | Get route history log |
| `POST` | `/api/routes/estimate` | Manager, Dispatcher | Calculate route distance, duration & fuel |
| `POST` | `/api/routes/suggest-vehicle` | Manager, Dispatcher | Get recommended vehicle for route |
| `GET` | `/api/schedule` | Authenticated | Get dispatch schedule |
| `POST` | `/api/schedule/auto-dispatch` | Manager, Dispatcher | Trigger auto-dispatch algorithm |
| `POST` | `/api/schedule/check-conflicts` | Manager, Dispatcher | Verify driver/vehicle schedule availability |
| `GET` | `/api/leaves` | Authenticated | Get driver leave requests |
| `POST` | `/api/leaves` | Manager | Create driver leave request |
| `PUT` | `/api/leaves/:id/status` | Manager | Approve or decline leave request |
| `DELETE` | `/api/leaves/:id` | Authenticated | Delete leave request |

### 11. 🔍 Global Search (`/api/search`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/search?q=query` | Authenticated | Multi-entity global search across fleet resources |

---

## ⚡ Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance running on port `27017` OR a MongoDB Atlas cluster URI.

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/FleetFlow-Team-NODEXA.git
cd FleetFlow-Team-NODEXA

# Install all monorepo dependencies across root, server, and client
npm run install:all
```

### 2. Configure Environment Variables
Ensure the root `.env` file exists with your setup details:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fleetflow
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development

VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Database with Realistic Data
Populate MongoDB with sample vehicles, drivers, active/scheduled trips, maintenance records, fuel logs, and user role accounts:
```bash
npm run seed
```

### 4. Start Development Servers
Run both backend and frontend concurrently with a single command:
```bash
npm run dev
```

- 🌐 **Frontend Application:** `http://localhost:5173`
- ⚙️ **Backend API Server:** `http://localhost:5000`

---

## 📈 Analytics & Export Features

- **Recharts Integration:** Visual breakdown of fleet utilization, monthly expense distribution, driver safety score distributions, and delivery metrics.
- **CSV Data Exporter:** One-click CSV export utility available on Vehicles, Drivers, Trips, Maintenance, and Expense tables for easy reporting and offline audit compliance.

---

<p align="center">
  <b>FleetFlow Management System</b> — Engineered for High Performance Logistics & Operations.
</p>

