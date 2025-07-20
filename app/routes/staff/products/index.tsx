import { createRoute } from "honox/factory"
import { Page } from "./-components/$page"

export default createRoute((c) => {
  return c.render(<Page pathname={c.req.path} />)
})
