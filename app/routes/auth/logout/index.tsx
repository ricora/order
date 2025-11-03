import { createRoute } from "honox/factory"
import { revokeSession } from "../../../middlewares/auth"

export default createRoute(async (c) => {
  await revokeSession(c)
  return c.redirect('/')
})
