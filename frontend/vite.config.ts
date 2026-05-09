import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8080,
    host: "127.0.0.1",
    // Add the line below to allow ngrok
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:9222",
        changeOrigin: true,
      },
    },
  },
});
