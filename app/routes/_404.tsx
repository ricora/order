import type { NotFoundHandler } from "hono"
import NotFound from "../components/ui/notFound"

const handler: NotFoundHandler = (c) => {
  c.status(404)
  return c.render(<NotFound homeHref="/" homeLabel="ホームに戻る" />)
}

export default handler
