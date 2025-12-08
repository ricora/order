import type { NotFoundHandler } from "hono"

const handler: NotFoundHandler = (c) => {
  c.status(404)
  return c.json({ message: "Not Found" })
}

export default handler
