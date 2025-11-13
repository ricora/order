import type { NotFoundHandler } from "hono"
import NotFound from "../../components/notFound"

const handler: NotFoundHandler = (c) => {
  c.status(404)
  return c.render(
    <NotFound homeHref="/staff" homeLabel="スタッフページに戻る" />,
  )
}

export default handler
