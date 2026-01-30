import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/": new URL("./app/frontend/", import.meta.url).pathname,
      "~/": new URL("./app/frontend/", import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["app/frontend/test/setup.ts"],
  },
})
