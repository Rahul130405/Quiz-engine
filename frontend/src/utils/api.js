import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
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
