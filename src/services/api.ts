import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor: injeta o token automaticamente em todas as requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@carbuapp:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});