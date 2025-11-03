import { createMiddleware } from "hono/factory"
import { createRoute } from "honox/factory"
import { createDbClient } from "../infrastructure/db/client"
import { oidcAuthMiddleware, setUserMiddleware } from "../middlewares/auth"

export default createRoute(
  createMiddleware(async (c, next) => {
    c.set("dbClient", await createDbClient())
    await next()
  }),
  oidcAuthMiddleware,
  setUserMiddleware,
)
