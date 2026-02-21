// client/src/services/api.js
import axios from "axios";

// Backend base URL
const API = axios.create({
  baseURL: "http://localhost:5000", // backend server URL
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