import { validator } from "hono/validator"
import { createRoute } from "honox/factory"
import { setOrderDetails } from "../../../../../usecases/commands/setOrderDetails"
import { getOrderEditPageData } from "../../../../../usecases/queries/getOrderEditPageData"
import { setToastCookie } from "../../../../-helpers/ui/toast"
import Layout from "../../../-components/layout"
import OrderSummary from "../-components/orderSummary"
import OrderEditForm from "./-components/$orderEditForm"

export const POST = createRoute(
  validator("form", (value, c) => {
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

    const allowedStatuses = [
      "pending",
      "processing",
      "completed",
      "cancelled",
    ] as const
    type OrderStatus = (typeof allowedStatuses)[number]
    const isOrderStatus = (v: unknown): v is OrderStatus =>
      typeof v === "string" && allowedStatuses.some((s) => s === v)

    if (!isOrderStatus(statusRaw)) {
      setToastCookie(c, "error", "不正なリクエストです")
      return c.redirect(c.req.url)
    }
    const status = statusRaw
    return { order: { customerName, comment, status } }
  }),
  async (c) => {
    const id = Number(c.req.param("id"))
    if (!Number.isInteger(id) || id <= 0) {
      return c.notFound()
    }

    const { order } = c.req.valid("form")
    const res = await setOrderDetails({
      dbClient: c.get("dbClient"),
      order: { id, ...order },
    })
    if (!res.ok) {
      setToastCookie(c, "error", res.message)
      return c.redirect(c.req.url)
    }
    setToastCookie(c, "success", "注文を更新しました")
    return c.redirect("/staff/orders")
  },
)

export default createRoute(async (c) => {
  const idParam = c.req.param("id")
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    return c.notFound()
  }

  const res = await getOrderEditPageData({
    order: { id },
    dbClient: c.get("dbClient"),
  })
  if (!res.ok) {
    if (res.message === "注文が見つかりません。") return c.notFound()
    throw new Error(res.message)
  }
  const { order } = res.value
  if (!order) return c.notFound()

  return c.render(
    <Layout title="注文編集" description="注文情報の編集を行います。">
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
