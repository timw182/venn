import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 81,
    host: "0.0.0.0",
    allowedHosts: ["venn.lu"],
    proxy: {
      "/api": {
        target: "http://localhost:7713",
        changeOrigin: true,
      },
    },
  },
});
