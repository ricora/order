import { validator } from "hono/validator"
import { createRoute } from "honox/factory"
import { setToastCookie } from "../../../../helpers/ui/toast"
import { registerOrder } from "../../../../usecases/registerOrder"
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
          return [] as { productId: number; quantity: number }[]
        }

        const parseAndValidate = (pidStr: string, qtyStr: string) => {
          const pid = Number(pidStr)
          const qty = Number(qtyStr)
          if (!Number.isFinite(pid) || !Number.isInteger(pid) || pid <= 0) {
            throw createInvalidRequestError()
          }
          if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) {
            throw createInvalidRequestError()
          }
          return { productId: pid, quantity: qty }
        }

        if (
          typeof productIdEntries === "string" &&
          typeof quantityEntries === "string"
        ) {
          return [parseAndValidate(productIdEntries, quantityEntries)]
        }

        if (
          Array.isArray(productIdEntries) &&
          Array.isArray(quantityEntries) &&
          productIdEntries.length === quantityEntries.length
        ) {
          return productIdEntries.map((id, index) =>
            parseAndValidate(id as string, quantityEntries[index] as string),
          )
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
