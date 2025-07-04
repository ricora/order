import path from "node:path"
import build from "@hono/vite-build/bun"
import adapter from "@hono/vite-dev-server/bun"
import tailwindcss from "@tailwindcss/vite"
import honox from "honox/vite"
import { defineConfig } from "vite"

export default defineConfig(({ mode }) => ({
  ...(mode === "client"
    ? {
        build: {
          rollupOptions: {
            input: ["./app/client.ts"],
          },
          manifest: true,
          emptyOutDir: false,
        },
      }
    : {
        ssr: {
          external: ["react", "react-dom"],
        },
        plugins: [
          honox({
            devServer: { adapter },
            client: { input: ["./app/style.css"] },
          }),
          tailwindcss(),
          build(),
        ],
      }),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
}))
