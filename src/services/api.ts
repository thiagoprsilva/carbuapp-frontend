import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor: injeta token e, se superadmin tiver uma oficina selecionada,
// envia o header x-oficina-id para o backend filtrar corretamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@carbuapp:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const selectedOficina = localStorage.getItem("@carbuapp:selectedOficina");
  if (selectedOficina) {
    try {
      const { id } = JSON.parse(selectedOficina);
      if (id) config.headers["x-oficina-id"] = String(id);
    } catch (_) {}
  }

  return config;
});
