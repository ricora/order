import type { Env } from "hono"
import { Hono } from "hono"
import { getOrderProgressPageData } from "../../usecases/getOrderProgressPageData"
import { getOrderRegistrationPageData } from "../../usecases/getOrderRegistrationPageData"
import { getProductRegistrationFormComponentData } from "../../usecases/getProductRegistrationFormComponentData"

/**
 * Web API for island components.
 */
const app = new Hono<Env>()
const routes = app
  .get("/order-registration-form", async (c) => {
    const { products, tags } = await getOrderRegistrationPageData({
      dbClient: c.get("dbClient"),
    })
    return c.json({ products, tags })
  })
  .get("/order-progress-manager", async (c) => {
    const { orders } = await getOrderProgressPageData({
      dbClient: c.get("dbClient"),
    })
    return c.json({ orders })
  })
  .get("/product-registration-form", async (c) => {
    const { tags } = await getProductRegistrationFormComponentData({
      dbClient: c.get("dbClient"),
    })
    return c.json({ tags })
  })

export default app
export type AppType = typeof routes
