import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "demo",
  plugins: [react()],
  build: {
    outDir: "../dist",
  },
  server: {
    open: true,
  },
});
