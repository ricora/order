import { validator } from "hono/validator"
import { createRoute } from "honox/factory"
import { setToastCookie } from "../../../../../helpers/ui/toast"
import { setOrderDetails } from "../../../../../usecases/commands/setOrderDetails"
import { getOrderEditPageData } from "../../../../../usecases/queries/getOrderEditPageData"
import Layout from "../../../-components/layout"
import OrderSummary from "../-components/orderSummary"
import OrderEditForm from "./-components/$orderEditForm"

export const POST = createRoute(
  validator("form", (value, c) => {
    try {
      const customerNameRaw = value.customerName
      const commentRaw = value.comment
      const statusRaw = value.status
      const customerName =
        typeof customerNameRaw === "string"
          ? customerNameRaw.trim().length > 0
            ? customerNameRaw.trim()
            : null
          : null

      const comment =
        typeof commentRaw === "string"
          ? commentRaw.trim().length > 0
            ? commentRaw.trim()
            : null
          : null

      const allowedStatuses = new Set<
        "pending" | "processing" | "completed" | "cancelled"
      >(["pending", "processing", "completed", "cancelled"])
      if (typeof statusRaw !== "string") {
        throw new Error("不正なリクエストです")
      }
      const candidateStatus = statusRaw as
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
      if (!allowedStatuses.has(candidateStatus)) {
        throw new Error("不正なリクエストです")
      }
      const status = candidateStatus
      return { order: { customerName, comment, status } }
    } catch (e) {
      setToastCookie(c, "error", String(e))
      return c.redirect(c.req.url)
    }
  }),
  async (c) => {
    try {
      const id = Number(c.req.param("id"))
      if (!Number.isInteger(id) || id <= 0) {
        return c.notFound()
      }

      const { order } = c.req.valid("form")
      await setOrderDetails({
        dbClient: c.get("dbClient"),
        order: { id, ...order },
      })

      setToastCookie(c, "success", "注文を更新しました")
      return c.redirect(`/staff/orders`)
    } catch (e) {
      setToastCookie(c, "error", String(e))
      return c.redirect(c.req.url)
    }
  },
)

export default createRoute(async (c) => {
  const idParam = c.req.param("id")
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    return c.notFound()
  }

  const { order } = await getOrderEditPageData({
    order: { id },
    dbClient: c.get("dbClient"),
  })
  if (!order) return c.notFound()

  return c.render(
    <Layout title={"注文編集"} description={"注文情報の編集を行います。"}>
      <div class="rounded-lg border bg-bg p-6">
        <h2 class="mb-2 font-bold text-lg">注文編集</h2>
        <div class="p-4">
          <OrderSummary order={order} />
          <div class="mt-4">
            <OrderEditForm initialValues={order} />
          </div>
        </div>
      </div>
    </Layout>,
  )
})
