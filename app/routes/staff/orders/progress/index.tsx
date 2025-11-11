import { createRoute } from "honox/factory"
import type Order from "../../../../domain/order/entities/order"
import { setToastCookie } from "../../../../helpers/ui/toast"
import {
  type SetOrderStatusParams,
  setOrderStatus,
} from "../../../../usecases/setOrderStatus"
import Layout from "../../-components/layout"
import OrderProgressManager from "./-components/$orderProgressManager"

const createInvalidFormDataError = () => {
  return new Error("不正なリクエストです")
}

const orderFormDataToSetOrderStatusParams = (
  formData: FormData,
): Omit<SetOrderStatusParams, "dbClient"> => {
  const orderId = Number(formData.get("orderId"))
  const status = String(
    formData.get("status") ?? "",
  ) as unknown as Order["status"]
  if (!Number.isInteger(orderId) || orderId <= 0)
    throw createInvalidFormDataError()
  const allowed = [
    "pending",
    "processing",
    "completed",
    "cancelled",
  ] satisfies Order["status"][]
  if (!allowed.includes(status)) throw createInvalidFormDataError()

  return {
    order: { id: orderId, status },
  }
}

export const POST = createRoute(async (c) => {
  try {
    const formData = await c.req.formData()
    const { order } = orderFormDataToSetOrderStatusParams(formData)

    await setOrderStatus({
      dbClient: c.get("dbClient"),
      order,
    })
    setToastCookie(c, "success", "注文の状態を更新しました")
  } catch (e) {
    setToastCookie(c, "error", String(e))
  }
  return c.redirect(c.req.url)
})

export default createRoute(async (c) => {
  return c.render(
    <Layout title={"注文進捗管理"} description={"注文の進捗を管理します。"}>
      <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-bg p-6">
        <h2 className="mb-4 font-bold text-lg">注文進捗管理</h2>
        <OrderProgressManager />
      </div>
    </Layout>,
  )
})
