// server/utils/telemetryHelper.js
const Trip = require("../models/Trip");
const axios = require("axios");

// City coordinate registry in India for geolocating routes
const CITY_COORDINATES = {
  "Mumbai": [19.0760, 72.8777],
  "Delhi": [28.6139, 77.2090],
  "Bangalore": [12.9716, 77.5946],
  "Chennai": [13.0827, 80.2707],
  "Kolkata": [22.5726, 88.3639],
  "Hyderabad": [17.3850, 78.4867],
  "Pune": [18.5204, 73.8567],
  "Ahmedabad": [23.0225, 72.5714],
  "Jaipur": [26.9124, 75.7873],
  "Lucknow": [26.8467, 80.9462],
  "Nagpur": [21.1458, 79.0882],
};

// Calculate heading angle in degrees between two coordinates
const calculateHeading = (coord1, coord2) => {
  if (!coord1 || !coord2) return 0;
  const lat1 = coord1[0] * Math.PI / 180;
  const lon1 = coord1[1] * Math.PI / 180;
  const lat2 = coord2[0] * Math.PI / 180;
  const lon2 = coord2[1] * Math.PI / 180;

  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return Math.round((brng + 360) % 360);
};

// Fetch real road routing via OpenStreetMap OSRM API, fallback to straight-line steps
const fetchRouteCoordinates = async (origin, destination) => {
  const originCoord = CITY_COORDINATES[origin] || CITY_COORDINATES["Mumbai"];
  const destCoord = CITY_COORDINATES[destination] || CITY_COORDINATES["Delhi"];

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originCoord[1]},${originCoord[0]};${destCoord[1]},${destCoord[0]}?overview=full&geometries=geojson`;
    const response = await axios.get(url, { timeout: 4000 });
    
    if (response.data && response.data.routes && response.data.routes[0]) {
      const oCoords = response.data.routes[0].geometry.coordinates; // Returns [lng, lat]
      const finalCoords = oCoords.map(c => [c[1], c[0]]); // Convert to [lat, lng]
      
      // If the route has too many points, downsample it slightly to make the UI update speed reasonable
      if (finalCoords.length > 250) {
        const step = Math.ceil(finalCoords.length / 200);
        const downsampled = [];
        for (let i = 0; i < finalCoords.length; i += step) {
          downsampled.push(finalCoords[i]);
        }
        if (downsampled[downsampled.length - 1] !== finalCoords[finalCoords.length - 1]) {
          downsampled.push(finalCoords[finalCoords.length - 1]);
        }
        return downsampled;
      }
      return finalCoords;
    }
  } catch (err) {
    console.error(`OSRM route query failed for ${origin} ➔ ${destination}. Falling back to interpolation.`);
  }

  // Fallback interpolation route: 100 points
  const points = [];
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = originCoord[0] + (destCoord[0] - originCoord[0]) * t;
    const lng = originCoord[1] + (destCoord[1] - originCoord[1]) * t;
    points.push([lat, lng]);
  }
  return points;
};

// Main function to run the tracking ticker
const setupTelemetry = (io) => {
  console.log("Telemetry Engine Active 🛰️");

  // Keep track of OSRM routing calls in-progress to prevent redundant HTTP queries
  const processingRoutes = new Set();

  setInterval(async () => {
    try {
      // Find all DISPATCHED (active) trips
      const activeTrips = await Trip.find({ status: "DISPATCHED" }).populate("vehicle driver");
      
      for (const trip of activeTrips) {
        // 1. If routeCoordinates are not generated yet, fetch them (OSRM / Fallback)
        if (!trip.routeCoordinates || trip.routeCoordinates.length === 0) {
          if (processingRoutes.has(trip._id.toString())) continue;
          processingRoutes.add(trip._id.toString());

          // Run route calculation in background to avoid blocking telemetry loop ticks
          fetchRouteCoordinates(trip.origin, trip.destination)
            .then(async (coords) => {
              trip.routeCoordinates = coords;
              trip.currentRouteIndex = 0;
              trip.currentLat = coords[0][0];
              trip.currentLng = coords[0][1];
              trip.currentSpeed = 0;
              trip.currentHeading = calculateHeading(coords[0], coords[1]);
              trip.telemetryStatus = "MOVING";
              trip.lastTelemetryUpdate = new Date();
              await trip.save();
              
              processingRoutes.delete(trip._id.toString());
              io.emit("telemetryReset", { tripId: trip._id, coordinates: coords });
            })
            .catch((e) => {
              console.error(e);
              processingRoutes.delete(trip._id.toString());
            });

          continue;
        }

        // 2. Drive the vehicle index forward
        const coords = trip.routeCoordinates;
        let nextIndex = trip.currentRouteIndex + 1;

        if (nextIndex >= coords.length) {
          // Trip has reached destination! Save, update statuses, & mark COMPLETED
          trip.status = "COMPLETED";
          trip.actualArrivalTime = new Date();
          trip.currentSpeed = 0;
          trip.telemetryStatus = "STOPPED";
          
          const finalDistance = trip.estimatedDistance || 100;
          trip.distance = finalDistance;
          trip.fuelUsed = Math.round(finalDistance * 0.25); // ~25L/100km
          trip.revenue = trip.cargoWeight * 25; // standard billing rate

          await trip.save();

          // Re-avail vehicle
          if (trip.vehicle) {
            trip.vehicle.status = "AVAILABLE";
            trip.vehicle.odometer += finalDistance;
            await trip.vehicle.save();
          }

          // Re-avail driver
          if (trip.driver) {
            trip.driver.status = "AVAILABLE";
            trip.driver.totalTrips = (trip.driver.totalTrips || 0) + 1;
            trip.driver.totalDistance = (trip.driver.totalDistance || 0) + finalDistance;
            trip.driver.totalRevenue = (trip.driver.totalRevenue || 0) + trip.revenue;
            await trip.driver.save();
          }

          console.log(`Trip TRP-${trip._id.toString().slice(-6).toUpperCase()} reached destination. Auto-completed. ✅`);
          io.emit("tripCompleted", { tripId: trip._id, vehicleId: trip.vehicle?._id, driverId: trip.driver?._id });
          continue;
        }

        // Calculate heading and speed
        const currentCoord = coords[trip.currentRouteIndex];
        const nextCoord = coords[nextIndex];
        const heading = calculateHeading(currentCoord, nextCoord);
        
        // Randomize speed between 55 and 78 km/h to simulate highway transit variance
        const speed = Math.floor(Math.random() * (78 - 55 + 1)) + 55;

        trip.currentRouteIndex = nextIndex;
        trip.currentLat = nextCoord[0];
        trip.currentLng = nextCoord[1];
        trip.currentSpeed = speed;
        trip.currentHeading = heading;
        trip.lastTelemetryUpdate = new Date();
        trip.telemetryStatus = "MOVING";
        
        await trip.save();

        // Calculate progress percentage, EDR (Est Distance Remaining), and ETA
        const progress = Math.round((nextIndex / coords.length) * 100);
        const estDistance = trip.estimatedDistance || 200;
        const distanceRemaining = parseFloat((estDistance * (1 - (nextIndex / coords.length))).toFixed(1));
        
        // Duration remaining calculation based on standard travel speeds
        const timeRemainingHours = distanceRemaining / 60; // 60km/h average
        const timeRemainingMin = Math.round(timeRemainingHours * 60);
        const eta = new Date(Date.now() + timeRemainingMin * 60 * 1000);

        io.emit("telemetryUpdate", {
          tripId: trip._id,
          currentLat: trip.currentLat,
          currentLng: trip.currentLng,
          currentSpeed: speed,
          currentHeading: heading,
          progress,
          distanceRemaining,
          timeRemainingMin,
          eta,
        });
      }
    } catch (err) {
      console.error("Telemetry Loop Error:", err);
    }
  }, 5000); // Ticks every 5 seconds
};

module.exports = { setupTelemetry, CITY_COORDINATES };
