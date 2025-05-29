import type { ErrorHandler } from "hono"

const handler: ErrorHandler = (e, c) => {
  if ("getResponse" in e) {
    return e.getResponse()
  }
  console.error(e.message)
  c.status(500)
  return c.render(<div>"Internal Server Error"</div>)
}

export default handler
