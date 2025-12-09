import type { Env } from "hono"
import { Hono } from "hono"
import { validator } from "hono/validator"
import type { Order } from "../../domain/order/entities"
import { setOrderStatus } from "../../usecases/commands/setOrderStatus"
import { getOrderProgressManagerComponentData } from "../../usecases/queries/getOrderProgressManagerComponentData"
import { getOrderRegistrationFormComponentData } from "../../usecases/queries/getOrderRegistrationFormComponentData"
import { getProductRegistrationFormComponentData } from "../../usecases/queries/getProductRegistrationFormComponentData"

/**
 * Web API for island components.
 */
const app = new Hono<Env>()
const routes = app
  .get("/order-registration-form", async (c) => {
    const res = await getOrderRegistrationFormComponentData({
      dbClient: c.get("dbClient"),
    })
    if (!res.ok) {
      throw new Error(res.message)
    }
    return c.json(res.value)
  })
  .get("/order-progress-manager", async (c) => {
    const res = await getOrderProgressManagerComponentData({
      dbClient: c.get("dbClient"),
    })
    if (!res.ok) throw new Error(res.message)
    return c.json(res.value)
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
        orderId < 1 ||
        typeof status !== "string" ||
        !isValidStatus(status)
      ) {
        return c.text("Invalid request", 400)
      }
      return { orderId, status }
    }),
    async (c) => {
      const { orderId, status } = await c.req.valid("json")
      const setRes = await setOrderStatus({
        dbClient: c.get("dbClient"),
        order: { id: orderId, status },
      })
      if (!setRes.ok) {
        if (setRes.message === "注文が見つかりません。") {
          return c.json({ message: setRes.message }, 404)
        }
        throw new Error(setRes.message)
      }
      const payloadRes = await getOrderProgressManagerComponentData({
        dbClient: c.get("dbClient"),
      })
      if (!payloadRes.ok) throw new Error(payloadRes.message)
      return c.json(payloadRes.value, 200)
    },
  )
  .get("/product-registration-form", async (c) => {
    const res = await getProductRegistrationFormComponentData({
      dbClient: c.get("dbClient"),
    })
    if (!res.ok) throw new Error(res.message)
    return c.json(res.value, 200)
  })

export default app
export type AppType = typeof routes
