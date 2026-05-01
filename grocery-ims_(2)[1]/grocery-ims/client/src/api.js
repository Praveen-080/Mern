import axios from "axios";

// In dev, leaving VITE_API_URL empty keeps relative calls ("/api/..."),
// which Vite proxies to the local Express server.
// In production (Netlify), set VITE_API_URL to your deployed API origin.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
