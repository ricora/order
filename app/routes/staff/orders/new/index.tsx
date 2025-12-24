import { validator } from "hono/validator"
import { createRoute } from "honox/factory"
import { registerOrder } from "../../../../usecases/commands/registerOrder"
import { setToastCookie } from "../../../-helpers/ui/toast"
import Layout from "../../-components/layout"
import OrderRegistrationForm from "./-components/$orderRegistrationForm"

export const POST = createRoute(
  validator("form", (value, c) => {
    const orderItems = (() => {
      const productIdEntries = value["items[][productId]"]
      const quantityEntries = value["items[][quantity]"]

      if (productIdEntries === undefined || quantityEntries === undefined) {
        return null
      }

      const parseAndValidate = (
        productIdEntry: string,
        quantityEntry: string,
      ) => {
        const productId = Number(productIdEntry)
        const quantity = Number(quantityEntry)
        if (
          !Number.isFinite(productId) ||
          !Number.isInteger(productId) ||
          productId <= 0
        ) {
          return null
        }
        if (
          !Number.isFinite(quantity) ||
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          return null
        }
        return { productId, quantity }
      }

      const isStringArray = (v: unknown): v is string[] =>
        Array.isArray(v) && v.every((e) => typeof e === "string")

      if (
        typeof productIdEntries === "string" &&
        typeof quantityEntries === "string"
      ) {
        const item = parseAndValidate(productIdEntries, quantityEntries)
        if (item === null) return null
        return [item]
      }

      if (
        isStringArray(productIdEntries) &&
        isStringArray(quantityEntries) &&
        productIdEntries.length === quantityEntries.length
      ) {
        const items = productIdEntries.map((id, index) => {
          const q = quantityEntries[index]
          if (q === undefined) return null
          return parseAndValidate(id, q)
        })
        const validItems = items.filter(
          (it): it is { productId: number; quantity: number } => it !== null,
        )
        if (validItems.length !== items.length) return null
        return validItems
      }

      return null
    })()

    if (orderItems === null) {
      setToastCookie(c, "error", "不正なリクエストです")
      return c.redirect(c.req.url)
    }

    return {
      order: {
        customerName:
          typeof value.customerName === "string" &&
          value.customerName.trim().length > 0
            ? value.customerName.trim()
            : null,
        comment:
          typeof value.comment === "string" && value.comment.trim().length > 0
            ? value.comment.trim()
            : null,
        orderItems,
      },
    }
  }),
  async (c) => {
    const { order } = c.req.valid("form")
    const res = await registerOrder({ dbClient: c.get("dbClient"), order })
    if (!res.ok) {
      setToastCookie(c, "error", res.message)
      return c.redirect(c.req.url)
    }
    setToastCookie(c, "success", "注文を登録しました")
    return c.redirect(c.req.url)
  },
)

export default createRoute(async (c) => {
  return c.render(
    <Layout title="注文登録" description="注文情報の登録を行います。">
      <div className="rounded-lg border bg-bg p-6">
        <h2 className="mb-4 font-bold text-lg">注文登録</h2>
        <OrderRegistrationForm />
      </div>
    </Layout>,
  )
})
