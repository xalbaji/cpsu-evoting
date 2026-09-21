import axios from "axios";

const isLocalhost = [
  "localhost",
  "127.0.0.1",
].includes(window.location.hostname);

const apiBaseUrl = isLocalhost
  ? "http://localhost:5000/api"
  : import.meta.env.VITE_API_URL || "https://cpsu-evoting.onrender.com/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 60000, // Added a 60-second timeout to handle Render free-tier cold starts
  headers: {
    "Content-Type": "application/json",
  },
});