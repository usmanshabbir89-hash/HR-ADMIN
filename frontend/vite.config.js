import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite settings
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Any request starting with /api is forwarded to the FastAPI backend.
    // So in React we can simply call fetch("/api/employees").
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
