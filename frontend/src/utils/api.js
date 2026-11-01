import axios from "axios";

// Use environment variable if provided, or default to relative path '/api' to support CRA proxy & Nginx reverse proxy
const baseURL = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Attach token on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("qe_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("qe_token");
      localStorage.removeItem("qe_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
