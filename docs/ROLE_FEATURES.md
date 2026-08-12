# Role-Based Access Control and Workflow Documentation

This document serves as the definitive reference for the role-based access control (RBAC), specific tasks, permissions, operational workflows, and data boundaries within the **FleetFlow Management System**.

---

## System Overview & Architecture

FleetFlow enforces strict RBAC at two tier levels:
1. **Frontend View Restrictions**: Handled through router guards (`ProtectedRoute.jsx`) and a permission authorization matrix (`permissions.js`). Navigation links in the sidebar are dynamic and filter out forbidden paths automatically.
2. **Backend Authentication & Authorization**: Handled via Express middleware by verifying the JSON Web Token (`verifyToken`) and checking the request sender's role against permitted enums using the `requireRole(...roles)` helper.

The application recognizes five specific user roles:
1. **Manager (Administrator)**
2. **Dispatcher (Operations)**
3. **Driver (Personnel)**
4. **Safety Officer (Safety & Maintenance)**
5. **Financial Analyst (Ledger & Accounting)**

---

## 1. Role: Manager

### A. Purpose & Context
The **Manager** serves as the system administrator with full access to CRUD operations across all models, billing accounts, user accounts, and strategic analytics.

### B. Complete List of Permissions
*   User account creation, deletion, and role updates.
*   Enrolling, updating, and removing vehicles.
*   Enrolling, updating, and terminating driver contracts.
*   Creating, dispatching, completing, and canceling shipment trips.
*   Requesting and approving/rejecting personnel leave requests.
*   Logging, resolving, and deleting maintenance logs.
*   Reporting and investigating safety incidents.
*   Logging operational expenses and exporting financial transactions.
*   Full view access to system analytics, Ledger reports, and live GPS tracking.

### C. Features Accessible
*   All menu links: Dashboard, Vehicles, Drivers, Trips, Dispatch Schedule, Live Tracking, Maintenance, Expenses, Fuel Management, Finance Ledger, Analytics, Users, Safety, and Profile Settings.

### D. Step-by-Step Task Workflows

#### 1. Onboarding a New Driver
1.  Navigate to the **Drivers** page.
2.  Click **Add Personnel**.
3.  Enter the driver's full name, commercial driver license (CDL) number, and license expiration date.
4.  Click **Onboard Personnel** to submit the record.

#### 2. Managing Leave Requests
1.  Navigate to the **Drivers** tab.
2.  Switch to the **Leave Requests** view.
3.  For any pending leave request, click **Approve** or **Reject**. This updates the driver's availability state accordingly.

#### 3. Creating a User Profile
1.  Go to the **Users** setting page.
2.  Input details for name, email, credentials, and select one of the five system roles.
3.  Submit to register the user.

---

## 2. Role: Dispatcher

### A. Purpose & Context
The **Dispatcher** handles day-to-day operations, including route planning, vehicle scheduling, real-time dispatching, and monitoring telemetry.

### B. Complete List of Permissions
*   Registering new fleet vehicles.
*   Updating vehicle and driver statuses (e.g., setting to AVAILABLE or SUSPENDED).
*   Routing estimation (queries OSRM for distance and costs) and vehicle recommendation.
*   Creating, scheduling, and dispatching trips.
*   Auto-dispatching schedule blocks based on date/time triggers.
*   Checking assignment conflicts.
*   Logging fuel entries in the Fuel Management interface.
*   Full live tracking view and trip progress logs.

### C. Features Accessible
*   Dashboard, Vehicles, Drivers, Trips, Dispatch Schedule, Live Tracking, Fuel-Management, and Profile Settings.

### D. Step-by-Step Task Workflows

#### 1. Creating and Dispatching a Trip
1.  Go to the **Trips** page.
2.  Click **New Dispatch Request**.
3.  Enter origin and destination cities, start date/time, and choose the assigned driver and vehicle.
4.  Click **Estimate Route & Suggest Vehicle** to query the server for route points, distance, and optimal transport units.
5.  Save the trip.
6.  Once the departure window arrives, click **Start Transit** (Dispatch). The vehicle immediately goes to **ON_TRIP**, and the telemetry background simulator begins routing calculations.

#### 2. Auto-dispatching Scheduled Trips
1.  Navigate to the **Dispatch Schedule** page.
2.  Click **Run Auto-Dispatch Ticker**.
3.  The server automatically scans for pending scheduled trips whose start window is active, matches resources, checks overlap conflicts, and changes statuses to transit.

---

## 3. Role: Driver

### A. Purpose & Context
The **Driver** represents the operational workforce. Their view is restricted to their current trip, personal profiles, and fuel logs.

### B. Complete List of Permissions
*   Viewing personal layout dashboards containing their metrics (trips driven, active cargo).
*   Viewing their active trip details and route coordinates.
*   Logging fuel refills they execute at stations.
*   Access to their Profile screen to update password credentials.

### C. Features Accessible
*   Dashboard (Driver variant), Trips (their own), Live GPS tracking (representing their own vehicle), Fuel Management, and Profile Settings.

### D. Step-by-Step Task Workflows
1.  Log into the app.
2.  Navigate to the **Trips** section to inspect the origin, destination, cargo details, and estimated fuel of the current assignment.
3.  Under **Live Tracking**, view their current location on the map generated by the telemetry engine.
4.  After filling up fuel at a station, go to **Fuel Management**, click **Log Fuel Entry**, and input filled volume (Liters), price per liter, station name, and current odometer reading.

---

## 4. Role: Safety Officer

### A. Purpose & Context
The **Safety Officer** oversees vehicle health, service issues, breakdown alerts, and compliance incidents.

### B. Complete List of Permissions
*   Logging fleet maintenance events (planned checks and emergency fixes).
*   Resolving ongoing maintenance logs.
*   Reporting safety incidents (accidents, overspeeding alerts, driver fatigue instances).
*   Updating incident statuses (e.g., changing status to INVESTIGATING or RESOLVED).
*   Access to live tracking to monitor vehicle speeds and locate breakdowns.

### C. Features Accessible
*   Dashboard, Vehicles, Drivers, Trips, Live Tracking, Maintenance, Safety (Incidents), and Profile Settings.

### D. Step-by-Step Task Workflows

#### 1. Logging and Resolving Maintenance
1.  Navigate to the **Maintenance** page.
2.  Click **Report Maintenance Need**.
3.  Select the affected vehicle, describe the work needed (e.g., brake adjustment), and select repair severity.
4.  Submit the form. This shifts the vehicle's status to **MAINTENANCE**, blocking dispatch tasks.
5.  After repairs are completed, click **Complete Work** on the maintenance entry row, input repair cost, and mark resolved. The vehicle returns to **AVAILABLE**.

#### 2. Filing an Incident Report
1.  Navigate to the **Safety** (Incidents) page.
2.  Click **Report Safety Incident**.
3.  Select the incident type, the corresponding vehicle and driver, severity index, coordinate location, date, and description.
4.  Submit the report.
5.  Update status to `UNDER_INVESTIGATION` or `RESOLVED` as investigation progress occurs.

---

## 5. Role: Financial Analyst

### A. Purpose & Context
The **Financial Analyst** tracks operational expenditure (OPEX), trip revenue, margins, and monthly financial summaries.

### B. Complete List of Permissions
*   Access to the overall financial ledgers.
*   Creating expense entries (maintenance costs, fuel costs, toll fees).
*   Viewing analytics charts regarding revenue trends, fleet utilization, and fuel costs.
*   Exporting financial transaction rows to CSV.

### C. Features Accessible
*   Dashboard, Vehicles, Drivers, Trips, Expenses, Fuel Management, Finance Ledger, Analytics, and Profile Settings.

### D. Step-by-Step Task Workflows

#### 1. Analyzing Profit & Loss (P&L) Reports
1.  Go to the **Finance Ledger** page.
2.  Examine aggregate charts showing absolute revenue versus accrued OPEX (maintenance + fuel costs).
3.  Read monthly reports indicating net profits.
4.  Click **Export Ledger** to download a CSV tracking spreadsheet of all raw expenses.

#### 2. Logging a Business Expense
1.  Navigate to the **Expenses** page.
2.  Click **Log Disbursement**.
3.  Identify the asset vehicle, choose type (`FUEL` or `MAINTENANCE`), input cost, and add details.
4.  Submit to record the transaction.

---

## Role Permissions & Visibility Matrix

Below is the structured matrix showing endpoint and path access:

| Path / Feature | Manager | Dispatcher | Driver | Safety Officer | Financial Analyst |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/dashboard` | View All | View Ops | Personal | View Safety | View Financial |
| `/vehicles` | CRUD | View / Edit Status | No Access | View Only | View Only |
| `/drivers` | CRUD | View / Edit Status | No Access | View Only | View Only |
| `/trips` | CRUD | CRUD | View Personal | View Only | View Only |
| `/schedule` | CRUD | CRUD | No Access | No Access | No Access |
| `/tracking` | Full Map | Full Map | Self Map | Full Map | Full Map |
| `/maintenance` | CRUD | No Access | No Access | Create / Resolve | No Access |
| `/expenses` | CRUD | No Access | No Access | No Access | CRUD |
| `/fuel` | CRUD | Log | Log | No Access | View |
| `/finance` | View Reports | No Access | No Access | No Access | View Reports |
| `/analytics` | View Reports | No Access | No Access | No Access | View Reports |
| `/users` | CRUD | No Access | No Access | No Access | No Access |
| `/incidents` | View / Status | No Access | No Access | Create / Status | No Access |
