import { defineConfig } from "vitest/config"

export default defineConfig({
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
