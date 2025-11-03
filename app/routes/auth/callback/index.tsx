import { createRoute } from "honox/factory"
import { processOAuthCallback } from "../../../middlewares/auth"

export default createRoute(async (c) => {
  return processOAuthCallback(c)
})
