import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import electron from "vite-plugin-electron"
import electronRenderer from "vite-plugin-electron-renderer"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        // Main process entry point
        entry: "src/main/index.ts",
        onstart({ startup }) {
          // Start the dev server if it's not already running
          startup()
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"],
              output: {
                entryFileNames: "main.js",
                format: "cjs",
              },
            },
          },
        },
      },
      {
        // Preload script
        entry: "src/preload/index.ts",
        onstart({ reload }) {
          // Reload the renderer process when the preload script changes
          reload()
        },
        vite: {
          build: {
            outDir: "dist-electron",
            lib: {
              entry: "src/preload/index.ts",
              fileName: "preload",
              formats: ["cjs"],
            },
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
    ]),
    electronRenderer(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
