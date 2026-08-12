// client/src/services/api.js
import axios from "axios";

// Normalize baseURL to strip trailing '/api' if present since page requests include '/api' prefix
let rawBaseUrl = import.meta.env.VITE_API_URL || "";
if (rawBaseUrl.endsWith("/api")) {
  rawBaseUrl = rawBaseUrl.replace(/\/api$/, "");
}

const API = axios.create({
  baseURL: rawBaseUrl,
});

// Add JWT token automatically to every request if exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // token from login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (expired/invalid token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;