import { defineConfig } from "vitest/config"
import viteConfig from "./vite.config"

// @ts-expect-error
export default defineConfig({
  ...viteConfig,
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    maxConcurrency: 1,
    fileParallelism: false,
    watch: false,
  },
})
