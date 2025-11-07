import { hc } from "hono/client"
import type { AppType } from "../../routes/api"

export const createHonoClient = () => {
  return hc<AppType>("/api")
}
