import build from "@hono/vite-build/bun"
import adapter from "@hono/vite-dev-server/bun"
import tailwindcss from "@tailwindcss/vite"
import honox from "honox/vite"
import { defineConfig } from "vite"

export default defineConfig({
  define: {
    // https://github.com/honojs/honox/issues/307
    "process.env": "process.env",
  },
  plugins: [
    honox({
      devServer: { adapter },
      client: { input: ["/app/client.ts", "/app/style.css"] },
    }),
    tailwindcss(),
    build(),
  ],
})
