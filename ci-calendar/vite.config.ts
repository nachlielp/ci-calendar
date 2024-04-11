import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  logLevel: "error", // Options are 'info', 'warn', 'error', or 'silent'
});
