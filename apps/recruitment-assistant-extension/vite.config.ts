import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  define: {
    __API_URL__: JSON.stringify(
      process.env.EXTENSION_API_URL ?? "https://app.avtonaim.qbsoft.ru",
    ),
    __EXTENSION_API_BASE__: JSON.stringify(
      process.env.EXTENSION_API_BASE ?? "http://localhost:3002",
    ),
  },
  plugins: [
    react(),
    webExtension({
      manifest: "./manifest.json",
    }) as any,
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
