import { etag } from "hono/etag"
import { createMiddleware } from "hono/factory"
import { createRoute } from "honox/factory"
import { createDbClient } from "../infrastructure/db/client"

export default createRoute(
  createMiddleware(async (c, next) => {
    c.set("dbClient", await createDbClient())
    await next()
  }),
  etag(),
)
