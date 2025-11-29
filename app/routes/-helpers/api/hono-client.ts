import { hc } from "hono/client"
import type { AppType } from "../../api"

export const createHonoClient = () => {
  return hc<AppType>("/api")
}
