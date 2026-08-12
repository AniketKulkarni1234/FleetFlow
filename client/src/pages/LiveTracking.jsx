// client/src/pages/LiveTracking.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import StatusPill from "../components/StatusPill";
import API from "../services/api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// City coordinates for map centering (mirrors server)
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

const LiveTracking = () => {
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [telemetry, setTelemetry] = useState({});

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routePolyline = useRef(null);
  const travelledPolyline = useRef(null);
  const vehicleMarker = useRef(null);
  const originMarker = useRef(null);
  const destMarker = useRef(null);
  const socketRef = useRef(null);

  // Fetch active trips from the REST API
  const fetchActiveTrips = useCallback(async () => {
    try {
      const res = await API.get("/api/trips/active");
      setActiveTrips(res.data);
      if (res.data.length > 0 && !selectedTripId) {
        setSelectedTripId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTripId]);

  // Socket.IO connection
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Telemetry socket connected ✅");
    });

    socket.on("telemetryUpdate", (data) => {
      setTelemetry((prev) => ({ ...prev, [data.tripId]: data }));
    });

    socket.on("telemetryReset", (data) => {
      // When a route is first calculated, refresh all trips
      fetchActiveTrips();
    });

    socket.on("tripCompleted", (data) => {
      toast.success(`Trip completed! Vehicle and driver are now available.`, { icon: "🏁", duration: 5000 });
      // Remove from active trips list
      setActiveTrips((prev) => prev.filter((t) => t._id !== data.tripId));
      if (selectedTripId === data.tripId) {
        setSelectedTripId(null);
      }
    });

    socket.on("disconnect", () => {
      console.log("Telemetry socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchActiveTrips();
  }, []);

  // Get the selected trip object
  const selectedTrip = activeTrips.find((t) => t._id === selectedTripId);
  const tripTelemetry = telemetry[selectedTripId] || {};

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [22.5, 78.5],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [loading, activeTrips]);

  // Update map when selected trip changes or telemetry updates
  useEffect(() => {
    const L = window.L;
    const map = mapInstance.current;
    if (!L || !map || !selectedTrip) return;

    // Clear previous layers
    if (routePolyline.current) { map.removeLayer(routePolyline.current); routePolyline.current = null; }
    if (travelledPolyline.current) { map.removeLayer(travelledPolyline.current); travelledPolyline.current = null; }
    if (vehicleMarker.current) { map.removeLayer(vehicleMarker.current); vehicleMarker.current = null; }
    if (originMarker.current) { map.removeLayer(originMarker.current); originMarker.current = null; }
    if (destMarker.current) { map.removeLayer(destMarker.current); destMarker.current = null; }

    const coords = selectedTrip.routeCoordinates;
    const hasRoute = coords && coords.length > 1;
    const originName = selectedTrip.origin || "Mumbai";
    const destName = selectedTrip.destination || "Delhi";
    const originCoord = hasRoute ? coords[0] : (CITY_COORDINATES[originName] || [19.076, 72.8777]);
    const destCoord = hasRoute ? coords[coords.length - 1] : (CITY_COORDINATES[destName] || [28.6139, 77.209]);

    const routeIdx = selectedTrip.currentRouteIndex || 0;
    const currentPos = (selectedTrip.currentLat && selectedTrip.currentLng)
      ? [selectedTrip.currentLat, selectedTrip.currentLng]
      : originCoord;

    // Origin marker
    const greenIcon = L.divIcon({
      className: "",
      html: `<div style="width:32px;height:32px;border-radius:50%;background:#10b981;border:3px solid #065f46;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(16,185,129,0.4)">A</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    originMarker.current = L.marker(originCoord, { icon: greenIcon })
      .addTo(map)
      .bindPopup(`<strong>Origin:</strong> ${originName}`);

    // Destination marker
    const redIcon = L.divIcon({
      className: "",
      html: `<div style="width:32px;height:32px;border-radius:50%;background:#6366f1;border:3px solid #312e81;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(99,102,241,0.4)">B</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    destMarker.current = L.marker(destCoord, { icon: redIcon })
      .addTo(map)
      .bindPopup(`<strong>Destination:</strong> ${destName}`);

    // Route polyline (full route — dim)
    if (hasRoute) {
      routePolyline.current = L.polyline(coords, {
        color: "#334155",
        weight: 4,
        opacity: 0.5,
        dashArray: "8 6",
      }).addTo(map);

      // Travelled route (bright)
      const travelledCoords = coords.slice(0, routeIdx + 1);
      if (travelledCoords.length > 1) {
        travelledPolyline.current = L.polyline(travelledCoords, {
          color: "#3b82f6",
          weight: 5,
          opacity: 0.9,
        }).addTo(map);
      }
    }

    // Vehicle marker (truck icon)
    const truckIcon = L.divIcon({
      className: "",
      html: `<div style="width:40px;height:40px;border-radius:50%;background:#2563eb;border:3px solid #1e40af;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(37,99,235,0.5);animation:pulse 2s infinite">🚚</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    vehicleMarker.current = L.marker(currentPos, { icon: truckIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`<strong>${selectedTrip.vehicle?.name || "Vehicle"}</strong><br/>Speed: ${selectedTrip.currentSpeed || 0} km/h`);

    // Fit bounds to show entire route
    const bounds = L.latLngBounds([originCoord, destCoord, currentPos]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });

  }, [selectedTripId, selectedTrip?.currentRouteIndex, activeTrips]);

  // Smoothly update vehicle marker position on telemetry ticks (no full re-render)
  useEffect(() => {
    const L = window.L;
    const map = mapInstance.current;
    if (!L || !map || !tripTelemetry.currentLat) return;

    const newPos = [tripTelemetry.currentLat, tripTelemetry.currentLng];

    // Update vehicle marker
    if (vehicleMarker.current) {
      vehicleMarker.current.setLatLng(newPos);
      vehicleMarker.current.setPopupContent(
        `<strong>${selectedTrip?.vehicle?.name || "Vehicle"}</strong><br/>Speed: ${tripTelemetry.currentSpeed || 0} km/h<br/>Heading: ${tripTelemetry.currentHeading || 0}°`
      );
    }

    // Extend travelled polyline
    if (travelledPolyline.current) {
      travelledPolyline.current.addLatLng(newPos);
    } else if (map) {
      travelledPolyline.current = L.polyline([newPos], {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
    }
  }, [tripTelemetry.currentLat, tripTelemetry.currentLng]);

  // Helpers
  const getProgress = (trip) => {
    const t = telemetry[trip._id];
    if (t?.progress) return t.progress;
    if (!trip.routeCoordinates?.length) return 0;
    return Math.round(((trip.currentRouteIndex || 0) / trip.routeCoordinates.length) * 100);
  };

  const getETA = () => {
    if (tripTelemetry.eta) return new Date(tripTelemetry.eta).toLocaleTimeString();
    return "Calculating…";
  };

  const getDistRemaining = () => {
    if (tripTelemetry.distanceRemaining !== undefined) return `${tripTelemetry.distanceRemaining} km`;
    if (selectedTrip?.estimatedDistance) return `${selectedTrip.estimatedDistance} km`;
    return "—";
  };

  const getSpeed = () => {
    if (tripTelemetry.currentSpeed) return `${tripTelemetry.currentSpeed} km/h`;
    if (selectedTrip?.currentSpeed) return `${selectedTrip.currentSpeed} km/h`;
    return "0 km/h";
  };

  const getHeading = () => {
    const deg = tripTelemetry.currentHeading || selectedTrip?.currentHeading || 0;
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  };

  const getTimeRemaining = () => {
    if (tripTelemetry.timeRemainingMin !== undefined) {
      const h = Math.floor(tripTelemetry.timeRemainingMin / 60);
      const m = tripTelemetry.timeRemainingMin % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    return "—";
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight">Real-Time Shipment Tracking</h1>
        <p className="text-slate-400 mt-1">Live GPS telemetry, road routing, ETA predictions & auto-completion</p>
      </div>

      {loading ? (
        <div className="skeleton h-96 w-full rounded-3xl"></div>
      ) : activeTrips.length === 0 ? (
        <div className="glass p-20 text-center rounded-3xl">
          <div className="text-6xl mb-6 opacity-30">📍</div>
          <h3 className="text-xl font-bold text-slate-300">No Active Shipments</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            No dispatched trips currently in transit. Go to the Trips page to dispatch one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left panel — Active shipments list */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest px-1">
              Active Dispatches ({activeTrips.length})
            </h2>
            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
              {activeTrips.map((trip) => {
                const isSelected = selectedTripId === trip._id;
                const progress = getProgress(trip);
                const t = telemetry[trip._id] || {};
                return (
                  <div
                    key={trip._id}
                    onClick={() => setSelectedTripId(trip._id)}
                    className={`p-5 rounded-2xl cursor-pointer border transition-all glass ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                        : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-white uppercase text-sm">
                          TRP-{trip._id.slice(-6).toUpperCase()}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {trip.origin || "Origin"} ➔ {trip.destination || "Destination"}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        progress > 75
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {progress}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <span>🚛 {trip.vehicle?.name || "Unit"}</span>
                      <span>{t.currentSpeed || trip.currentSpeed || 0} km/h</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel — Map + telemetry details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Interactive Map */}
            <div className="glass rounded-3xl overflow-hidden border border-white/5 relative">
              {/* Live indicator badge */}
              <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live GPS Active</span>
              </div>
              <div
                ref={mapRef}
                id="tracking-map"
                style={{ height: "420px", width: "100%", background: "#0f172a" }}
              ></div>
            </div>

            {/* Telemetry stat cards */}
            {selectedTrip && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Speed</p>
                  <p className="text-2xl font-extrabold text-white">{getSpeed()}</p>
                </div>
                <div className="glass p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Heading</p>
                  <p className="text-2xl font-extrabold text-white">{getHeading()}</p>
                  <p className="text-[10px] text-slate-500">{tripTelemetry.currentHeading || selectedTrip?.currentHeading || 0}°</p>
                </div>
                <div className="glass p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Remaining</p>
                  <p className="text-2xl font-extrabold text-white">{getDistRemaining()}</p>
                </div>
                <div className="glass p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ETA</p>
                  <p className="text-xl font-extrabold text-emerald-400">{getETA()}</p>
                </div>
              </div>
            )}

            {/* Detailed info panels */}
            {selectedTrip && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Resource details */}
                <div className="glass p-6 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Resource Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vehicle:</span>
                      <span className="text-slate-200 font-semibold">{selectedTrip.vehicle?.name || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plate:</span>
                      <span className="font-mono text-slate-300">{selectedTrip.vehicle?.licensePlate || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver:</span>
                      <span className="text-slate-200 font-semibold">{selectedTrip.driver?.name || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cargo:</span>
                      <span className="text-slate-200 font-semibold">{selectedTrip.cargoWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <StatusPill status={selectedTrip.telemetryStatus || "MOVING"} />
                    </div>
                  </div>
                </div>

                {/* Tracking logistics */}
                <div className="glass p-6 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Tracking Logistics</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Departure:</span>
                      <span className="text-slate-300 font-medium">
                        {selectedTrip.actualDepartureTime
                          ? new Date(selectedTrip.actualDepartureTime).toLocaleTimeString()
                          : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Distance:</span>
                      <span className="text-slate-300 font-medium">{selectedTrip.estimatedDistance || 0} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time Remaining:</span>
                      <span className="text-amber-400 font-bold">{getTimeRemaining()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Est. Fuel Cost:</span>
                      <span className="text-emerald-400 font-bold">₹{selectedTrip.estimatedFuelCost || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Update:</span>
                      <span className="text-slate-400 text-xs">
                        {selectedTrip.lastTelemetryUpdate
                          ? new Date(selectedTrip.lastTelemetryUpdate).toLocaleTimeString()
                          : "Awaiting data…"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Inject pulse animation for the truck marker */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 100px; }
        .leaflet-container { border-radius: 1.5rem; }
      `}</style>
    </Layout>
  );
};

export default LiveTracking;
