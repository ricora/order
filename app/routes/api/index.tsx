import type { Env } from "hono"
import { Hono } from "hono"
import { validator } from "hono/validator"
import type Order from "../../domain/order/entities/order"
import { getOrderProgressManagerComponentData } from "../../usecases/getOrderProgressManagerComponentData"
import { getOrderRegistrationFormComponentData } from "../../usecases/getOrderRegistrationFormComponentData"
import { getProductRegistrationFormComponentData } from "../../usecases/getProductRegistrationFormComponentData"
import { setOrderStatus } from "../../usecases/setOrderStatus"

/**
 * Web API for island components.
 */
const app = new Hono<Env>()
const routes = app
  .get("/order-registration-form", async (c) => {
    const { products, tags } = await getOrderRegistrationFormComponentData({
      dbClient: c.get("dbClient"),
    })
    return c.json({ products, tags })
  })
  .get("/order-progress-manager", async (c) => {
    const {
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
    } = await getOrderProgressManagerComponentData({
      dbClient: c.get("dbClient"),
    })
    return c.json({
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
    })
  })
  .post(
    "/order-progress-manager/set-status",
    validator("json", (value, c) => {
      const orderId = value.orderId
      const status = value.status

      const isValidStatus = (value: unknown): value is Order["status"] => {
        return (
          typeof value === "string" &&
          ["pending", "processing", "completed", "cancelled"].includes(value)
        )
      }
      if (
        typeof orderId !== "number" ||
        !Number.isInteger(orderId) ||
        typeof status !== "string" ||
        !isValidStatus(status)
      ) {
        return c.text("Invalid request", 400)
      }
      return { orderId, status }
    }),
    async (c) => {
      try {
        const { orderId, status } = await c.req.valid("json")

        await setOrderStatus({
          dbClient: c.get("dbClient"),
          order: { id: orderId, status },
        })
        return c.text("Success", 200)
      } catch (e) {
        return c.text(
          `Error: ${e instanceof Error ? e.message : String(e)}`,
          500,
        )
      }
    },
  )
  .get("/product-registration-form", async (c) => {
    const { tags } = await getProductRegistrationFormComponentData({
      dbClient: c.get("dbClient"),
    })
    return c.json({ tags })
  })

export default app
export type AppType = typeof routes
