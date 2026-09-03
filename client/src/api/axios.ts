import axios from "axios";

const isLocalhost = [
  "localhost",
  "127.0.0.1",
].includes(window.location.hostname);

const apiBaseUrl = isLocalhost
  ? "http://localhost:5000/api"
  : import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});