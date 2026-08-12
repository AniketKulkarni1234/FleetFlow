// server/seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("./models/User");
const Vehicle = require("./models/Vehicle");
const Driver = require("./models/Driver");
const Trip = require("./models/Trip");
const Expense = require("./models/Expense");
const FuelEntry = require("./models/FuelEntry");
const Maintenance = require("./models/Maintenance");
const Incident = require("./models/Incident");
const LeaveRequest = require("./models/LeaveRequest");

// City coordinates for maps / routing simulations
const CITY_COORDINATES = {
  "Mumbai": [19.076, 72.8777],
  "Delhi": [28.6139, 77.209],
  "Bangalore": [12.9716, 77.5946],
  "Chennai": [13.0827, 80.2707],
  "Kolkata": [22.5726, 88.3639],
  "Hyderabad": [17.385, 78.4867],
  "Pune": [18.5204, 73.8567],
  "Ahmedabad": [23.0225, 72.5714],
  "Jaipur": [26.9124, 75.7873],
  "Lucknow": [26.8467, 80.9462],
  "Nagpur": [21.1458, 79.0882],
};

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fleetflow";

const seedData = async () => {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully! Cleansing existing data...");

    // Clear existing collections
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await Expense.deleteMany({});
    await FuelEntry.deleteMany({});
    await Maintenance.deleteMany({});
    await Incident.deleteMany({});
    await LeaveRequest.deleteMany({});

    console.log("DB Cleansed. Seeding new data...");

    // Heap passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    // 1. Create Users
    const users = await User.insertMany([
      { name: "Aditya Verma", email: "manager@fleetflow.com", password: passwordHash, role: "Manager" },
      { name: "Rahul Sharma", email: "dispatcher@fleetflow.com", password: passwordHash, role: "Dispatcher" },
      { name: "Vikram Singh", email: "driver@fleetflow.com", password: passwordHash, role: "Driver" },
      { name: "Suresh Pillai", email: "safety@fleetflow.com", password: passwordHash, role: "SafetyOfficer" },
      { name: "Neha Gupta", email: "finance@fleetflow.com", password: passwordHash, role: "FinancialAnalyst" },
    ]);
    console.log("Enrolled users (5 distinct roles created, पासवर्ड: password123)");

    const managerUser = users[0];
    const dispatcherUser = users[1];
    const driverUser = users[2];
    const safetyUser = users[3];
    const financeUser = users[4];

    // 2. Create Vehicles
    const vehiclesData = [
      {
        name: "Tata Prima 4930.S",
        licensePlate: "MH-12-PQ-8834",
        maxCapacity: 40000,
        odometer: 142050,
        status: "AVAILABLE",
        acquisitionCost: 3500000,
        revenue: 450000,
        insuranceExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Expiary in 45 days
        permitExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        rcNumber: "RC-MH12PQ8834",
        rcExpiry: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000),
        pucNumber: "PUC-8834BH",
        pucExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Expiry within 15 days
        documents: [
          { name: "MH Registration papers", type: "RC", docNumber: "RC-MH12PQ8834", expiryDate: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        name: "BharatBenz 3528C Heavy Tipper",
        licensePlate: "MH-14-JK-9901",
        maxCapacity: 35000,
        odometer: 89400,
        status: "ON_TRIP",
        acquisitionCost: 4200000,
        revenue: 720000,
        insuranceExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        permitExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        rcNumber: "RC-MH14JK9901",
        rcExpiry: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000),
        pucNumber: "PUC-9901AA",
        pucExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        documents: []
      },
      {
        name: "Mahindra Blazo X 49 Cargo Carrier",
        licensePlate: "KA-03-MM-5561",
        maxCapacity: 45000,
        odometer: 182000,
        status: "AVAILABLE",
        acquisitionCost: 3800000,
        revenue: 890000,
        insuranceExpiry: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // EXPIRED insurance!
        permitExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        rcNumber: "RC-KA03MM5561",
        rcExpiry: new Date(Date.now() + 600 * 24 * 60 * 60 * 1000),
        pucNumber: "PUC-5561CC",
        pucExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        documents: []
      },
      {
        name: "Ashok Leyland Ecomet 1215",
        licensePlate: "DL-01-CA-2339",
        maxCapacity: 12000,
        odometer: 64100,
        status: "IN_SHOP", // In Maintenance 
        acquisitionCost: 1900000,
        revenue: 310000,
        insuranceExpiry: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Near expiry
        permitExpiry: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // EXPIRED permit!
        rcNumber: "RC-DL01CA2339",
        rcExpiry: new Date(Date.now() + 800 * 24 * 60 * 60 * 1000),
        pucNumber: "PUC-2339DL",
        pucExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        documents: []
      },
      {
        name: "Eicher Pro 6028",
        licensePlate: "KA-51-EF-4421",
        maxCapacity: 28000,
        odometer: 104500,
        status: "AVAILABLE",
        acquisitionCost: 2800000,
        revenue: 560000,
        insuranceExpiry: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
        permitExpiry: new Date(Date.now() + 250 * 24 * 60 * 60 * 1000),
        rcNumber: "RC-KA51EF4421",
        rcExpiry: new Date(Date.now() + 900 * 24 * 60 * 60 * 1000),
        pucNumber: "PUC-4421ZZ",
        pucExpiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // EXPIRED PUC!
        documents: []
      },
      {
        name: "Volvo FMX 460 Heavy Hauler",
        licensePlate: "KA-53-UT-1049",
        maxCapacity: 60000,
        odometer: 32000,
        status: "AVAILABLE",
        acquisitionCost: 8500000,
        revenue: 1200000,
        insuranceExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
        permitExpiry: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000),
        rcNumber: "RC-KA53UT1049",
        rcExpiry: new Date(Date.now() + 1100 * 24 * 60 * 60 * 1000),
        pucNumber: "PUC-1049VV",
        pucExpiry: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
        documents: []
      }
    ];

    const vehicles = await Vehicle.insertMany(vehiclesData);
    console.log(`Registered ${vehicles.length} Heavy Duty Vehicles`);

    // 3. Create Drivers
    const driversData = [
      {
        name: "Vikram Singh",
        licenseNumber: "DL-142021008456",
        licenseExpiry: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000),
        status: "ON_TRIP",
        safetyScore: 92,
        user: driverUser._id,
        phone: "+91 98765 43210",
        salaryBase: 25000,
        salaryPerKm: 7.0,
        totalTrips: 42,
        totalDistance: 24500,
        totalRevenue: 670000,
        documents: [
          { name: "Heavy Loading License", type: "License", docNumber: "DL-142021008456", expiryDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        name: "Harpreet Singh",
        licenseNumber: "PB-023020005432",
        licenseExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // expiring in 15 days!
        status: "AVAILABLE",
        safetyScore: 95,
        phone: "+91 94100 23456",
        salaryBase: 24000,
        salaryPerKm: 6.8,
        totalTrips: 58,
        totalDistance: 31000,
        totalRevenue: 850000,
        documents: []
      },
      {
        name: "Rajesh Kumar",
        licenseNumber: "KA-052018009981",
        licenseExpiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // EXPIRED license!
        status: "SUSPENDED",
        safetyScore: 68, // Low score 
        phone: "+91 80921 54321",
        salaryBase: 20000,
        salaryPerKm: 6.0,
        totalTrips: 18,
        totalDistance: 7800,
        totalRevenue: 150000,
        documents: []
      },
      {
        name: "Anil Deshmukh",
        licenseNumber: "MH-122019002241",
        licenseExpiry: new Date(Date.now() + 600 * 24 * 60 * 60 * 1000),
        status: "AVAILABLE",
        safetyScore: 98,
        phone: "+91 77200 11993",
        salaryBase: 26000,
        salaryPerKm: 7.2,
        totalTrips: 84,
        totalDistance: 51200,
        totalRevenue: 1450000,
        documents: []
      },
      {
        name: "Gurpreet Aluwalia",
        licenseNumber: "PB-033017006789",
        licenseExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "AVAILABLE",
        safetyScore: 89,
        phone: "+91 99188 77553",
        salaryBase: 23000,
        salaryPerKm: 6.5,
        totalTrips: 37,
        totalDistance: 19800,
        totalRevenue: 490000,
        documents: []
      }
    ];

    const drivers = await Driver.insertMany(driversData);
    console.log(`Registered ${drivers.length} commercial drivers`);

    // 4. Create Trips
    // 4.1 Completed Trips (Calculates metrics)
    const trip1 = await Trip.create({
      vehicle: vehicles[0]._id, // Tata Prima 4930
      driver: drivers[0]._id,   // Vikram Singh
      cargoWeight: 28000,
      status: "COMPLETED",
      distance: 1420,
      fuelUsed: 405, // ~3.5 km/L
      revenue: 213000,
      origin: "Mumbai",
      destination: "Delhi",
      scheduledDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      estimatedDistance: 1410,
      estimatedFuelCost: 38000,
      actualDepartureTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      actualArrivalTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      notes: "Cargo: Steel rolls. Safe delivery, on-time.",
    });

    const trip2 = await Trip.create({
      vehicle: vehicles[2]._id, // Mahindra Blazo
      driver: drivers[3]._id,   // Anil Deshmukh
      cargoWeight: 32000,
      status: "COMPLETED",
      distance: 1010,
      fuelUsed: 310,
      revenue: 165000,
      origin: "Bangalore",
      destination: "Mumbai",
      scheduledDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      estimatedDistance: 990,
      estimatedFuelCost: 29500,
      actualDepartureTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      actualArrivalTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: "Cargo: Fast moving consumer goods.",
    });

    const trip3 = await Trip.create({
      vehicle: vehicles[4]._id, // Eicher Pro
      driver: drivers[4]._id,   // Gurpreet Aluwalia
      cargoWeight: 22000,
      status: "COMPLETED",
      distance: 350,
      fuelUsed: 95,
      revenue: 58000,
      origin: "Pune",
      destination: "Mumbai",
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      estimatedDistance: 330,
      estimatedFuelCost: 9000,
      actualDepartureTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      actualArrivalTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours
      notes: "Express freight shipment.",
    });

    // 4.2 Dispatched Trip (Active tracking trip!)
    // Solve route: Pune to Bangalore simulation
    const puneCoord = CITY_COORDINATES["Pune"];
    const bangaloreCoord = CITY_COORDINATES["Bangalore"];
    const routeCoordinates = [
      puneCoord,
      [17.8, 74.5],
      [16.8, 75.2],
      [15.3, 76.1],
      [14.1, 76.9],
      [13.5, 77.2],
      bangaloreCoord
    ];

    const activeTrip = await Trip.create({
      vehicle: vehicles[1]._id, // BharatBenz 3528C at ON_TRIP
      driver: drivers[0]._id,   // Vikram Singh at ON_TRIP
      cargoWeight: 24000,
      status: "DISPATCHED",
      origin: "Pune",
      destination: "Bangalore",
      scheduledDate: new Date(),
      estimatedDistance: 840,
      estimatedFuelCost: 26000,
      actualDepartureTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // started 24 hours ago
      routeCoordinates: routeCoordinates,
      currentLat: routeCoordinates[2][0],
      currentLng: routeCoordinates[2][1],
      currentRouteIndex: 2,
      currentSpeed: 62,
      currentHeading: 145,
      lastTelemetryUpdate: new Date(),
      telemetryStatus: "MOVING",
      notes: "Cargo: Industrial parts. High priority."
    });

    // 4.3 Scheduled/Draft Trips
    const draftTrip = await Trip.create({
      vehicle: vehicles[5]._id, // Volvo FMX
      driver: drivers[1]._id,
      cargoWeight: 45000,
      status: "DRAFT",
      origin: "Kolkata",
      destination: "Delhi",
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // scheduled in 2 days
      estimatedDistance: 1450,
      estimatedFuelCost: 45000,
      notes: "Cargo: Coal transport. Setup for Dispatch check."
    });

    console.log("Simulating trip schedules & live telemetry records");

    // 5. Create Expenses
    const expensesData = [
      { vehicle: vehicles[0]._id, liters: 405, cost: 38475, type: "FUEL", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { vehicle: vehicles[2]._id, liters: 310, cost: 29450, type: "FUEL", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { vehicle: vehicles[4]._id, liters: 95, cost: 9025, type: "FUEL", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { vehicle: vehicles[3]._id, cost: 18500, type: "MAINTENANCE", date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }, // Ashok Leyland brake system Fix
      { vehicle: vehicles[1]._id, cost: 12000, type: "MAINTENANCE", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
    ];

    const expenses = await Expense.insertMany(expensesData);
    console.log(`Committed ${expenses.length} financial transactions to ledger`);

    // 6. Fuel Entries
    const fuelEntriesData = [
      {
        vehicle: vehicles[0]._id,
        driver: drivers[0]._id,
        liters: 150,
        costPerLiter: 95.5,
        totalCost: 14325,
        odometerReading: 141200,
        fuelStation: "HP Refuel Facility, Mumbai Highway",
        date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        vehicle: vehicles[0]._id,
        driver: drivers[0]._id,
        liters: 255,
        costPerLiter: 94.7,
        totalCost: 24150,
        odometerReading: 142050,
        fuelStation: "IndianOil Transit Station, NH44",
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        vehicle: vehicles[2]._id,
        driver: drivers[3]._id,
        liters: 310,
        costPerLiter: 95.0,
        totalCost: 29450,
        odometerReading: 182000,
        fuelStation: "Bharat Petroleum Mega Depot",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];

    await FuelEntry.insertMany(fuelEntriesData);
    console.log("Logged historical fuel refills & consumption cards");

    // 7. Maintenance Records
    const maintenanceData = [
      {
        vehicle: vehicles[3]._id, // Ashok Leyland in Maintenance
        description: "Complete overhaul of pneumatic braking assemblies & brake fluid flush.",
        status: "PENDING",
        date: new Date(),
        scheduledDate: new Date(),
        serviceType: "Breakdown",
        spareParts: [
          { name: "Brake Lining Set", cost: 6500, quantity: 2 },
          { name: "Pneumatic Valve Hose", cost: 1200, quantity: 4 }
        ],
        vendor: { name: "SafeTruck Services Ltd.", phone: "+91 88442 21100", address: "GIDC Industrial Zone, Delhi" }
      },
      {
        vehicle: vehicles[0]._id,
        description: "Scheduled general oil filtration checkups & tyre rotation.",
        status: "RESOLVED",
        date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        serviceType: "Scheduled",
        serviceCost: 15000,
        spareParts: [
          { name: "Synthetic Lubricant Oil", cost: 9500, quantity: 1 }
        ],
        vendor: { name: "Tata Authorized Service Depot", phone: "+91 22880 44331", address: "Highway Link Road, Pune" }
      },
      {
        vehicle: vehicles[5]._id, // Volvo
        description: "Preventative transmission inspection & pressure checks.",
        status: "UPCOMING",
        scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // in 10 days
        serviceType: "Scheduled"
      }
    ];

    await Maintenance.insertMany(maintenanceData);
    console.log("Inserted pending, upcoming, and completed vehicle service records");

    // 8. Incidents
    const incidentsData = [
      {
        type: "Overspeed",
        vehicle: vehicles[1]._id, // BharatBenz
        driver: drivers[0]._id,   // Vikram Singh
        severity: "Medium",
        description: "Speed alert exceeded threshold (recorded 104 km/h in a 80 km/h zoning zone).",
        location: "Mumbai-Pune Expressway, km 42",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "RESOLVED"
      },
      {
        type: "Vehicle Breakdown",
        vehicle: vehicles[3]._id, // Ashok Leyland
        driver: drivers[1]._id,   // Harpreet Singh
        severity: "High",
        description: "Sudden pressure loss in primary brake lines during transit.",
        location: "National Highway 48, near Jaipur Bypass",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "UNDER_INVESTIGATION"
      }
    ];

    await Incident.insertMany(incidentsData);
    console.log("Populated fleet safety alerts & overspeed logs");

    // 9. Leave Requests
    const leavesData = [
      {
        driver: drivers[1]._id, // Harpreet
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        reason: "Family wedding event in Punjab.",
        status: "PENDING"
      },
      {
        driver: drivers[4]._id, // Gurpreet
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        reason: "Medical leave for health checkup.",
        status: "APPROVED"
      }
    ];

    await LeaveRequest.insertMany(leavesData);
    console.log("Indexed driver leaves & rest schedules");

    console.log("Database seeded successfully! 🎉 All UI elements will now display realistic operational telemetry data.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed critical error:", err.message);
    process.exit(1);
  }
};

seedData();
