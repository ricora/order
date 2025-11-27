import { validator } from "hono/validator"
import { createRoute } from "honox/factory"
import { setToastCookie } from "../../../../helpers/ui/toast"
import { registerOrder } from "../../../../usecases/commands/registerOrder"
import Layout from "../../-components/layout"
import OrderRegistrationForm from "./-components/$orderRegistrationForm"

const createInvalidRequestError = () => new Error("不正なリクエストです")

export const POST = createRoute(
  validator("form", (value, c) => {
    try {
      const orderItems = (() => {
        const productIdEntries = value["items[][productId]"]
        const quantityEntries = value["items[][quantity]"]

        if (productIdEntries === undefined || quantityEntries === undefined) {
          throw createInvalidRequestError()
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
            throw createInvalidRequestError()
          }
          if (
            !Number.isFinite(quantity) ||
            !Number.isInteger(quantity) ||
            quantity <= 0
          ) {
            throw createInvalidRequestError()
          }
          return { productId, quantity }
        }

        const isStringArray = (v: unknown): v is string[] =>
          Array.isArray(v) && v.every((e) => typeof e === "string")

        if (
          typeof productIdEntries === "string" &&
          typeof quantityEntries === "string"
        ) {
          return [parseAndValidate(productIdEntries, quantityEntries)]
        }

        if (
          isStringArray(productIdEntries) &&
          isStringArray(quantityEntries) &&
          productIdEntries.length === quantityEntries.length
        ) {
          return productIdEntries.map((id, index) => {
            const q = quantityEntries[index]
            if (q === undefined) throw createInvalidRequestError()
            return parseAndValidate(id, q)
          })
        }

        throw createInvalidRequestError()
      })()

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
    } catch (e) {
      setToastCookie(c, "error", String(e))
      return c.redirect(c.req.url)
    }
  }),
  async (c) => {
    try {
      const { order } = c.req.valid("form")
      await registerOrder({ dbClient: c.get("dbClient"), order })

      setToastCookie(c, "success", "注文を登録しました")
    } catch (e) {
      setToastCookie(c, "error", String(e))
    }
    return c.redirect(c.req.url)
  },
)

export default createRoute(async (c) => {
  return c.render(
    <Layout title={"注文登録"} description={"注文情報の登録を行います。"}>
      <div className="rounded-lg border bg-bg p-6">
        <h2 className="mb-4 font-bold text-lg">注文登録</h2>
        <OrderRegistrationForm />
      </div>
    </Layout>,
  )
})
