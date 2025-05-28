import { showRoutes } from "hono/dev"
import { createApp } from "honox/server"

const ROUTES = import.meta.glob(
  [
    "/app/routes/**/!(_*|-*|$*|*.test|*.spec).(ts|tsx|md|mdx)",
    "/app/routes/.well-known/**/!(_*|-*|$*|*.test|*.spec).(ts|tsx|md|mdx)",
    "!/app/routes/**/-*/**/*",
  ],
  {
    eager: true,
  },
)

const app = createApp({
  // @ts-expect-error
  ROUTES,
})

showRoutes(app)

export default app
