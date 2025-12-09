import { etag } from "hono/etag"
import { createMiddleware } from "hono/factory"
import { logger } from "hono/logger"
import { createRoute } from "honox/factory"
import { createDbClient } from "../libs/db/client"

export default createRoute(
  createMiddleware(async (c, next) => {
    c.set("dbClient", await createDbClient())
    await next()
  }),
  // https://github.com/honojs/hono/issues/4031
  createMiddleware(async (c, next) => {
    await next()
    const contentType = (c.res.headers.get("content-type") || "").toLowerCase()
    if (contentType?.includes("json")) {
      return
    }
    const eTagHandler = etag()
    await eTagHandler(c, async () => {})
  }),
  logger(),
)
