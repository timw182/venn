import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5500,
    host: "0.0.0.0",
    allowedHosts: ["venn.amoreapp.net", "kinklink.amoreapp.net"],
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
