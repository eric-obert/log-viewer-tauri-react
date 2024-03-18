import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as monaco from 'monaco-editor';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  }
});
