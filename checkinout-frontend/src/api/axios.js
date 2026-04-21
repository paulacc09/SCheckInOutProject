import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

// Adjunta token JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("checkinout_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejo global de 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("checkinout_token");
      localStorage.removeItem("checkinout_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
