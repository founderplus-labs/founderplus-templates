import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Founder+ React templates — Vite 7 + React 19 + Tailwind v4.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
