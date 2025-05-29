import type { NotFoundHandler } from "hono"

const handler: NotFoundHandler = (c) => {
  c.status(404)
  return c.render(<div>404 Not Found</div>)
}

export default handler
