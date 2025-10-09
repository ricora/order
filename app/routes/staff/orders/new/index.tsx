import { createRoute } from "honox/factory"
import { findAllOrders } from "../../../../domain/order/repositories/orderQueryRepository"
import { setToastCookie } from "../../../../helpers/ui/toast"
import { getOrderRegistrationPageData } from "../../../../usecases/getOrderRegistrationPageData"
import {
  type RegisterOrderParams,
  registerOrder,
} from "../../../../usecases/registerOrder"
import Layout from "../../-components/layout"
import OrderRegister from "./-components/$orderRegister"

const createInvalidFormDataError = () => {
  return new Error("不正なフォームデータです")
}

const orderFormDataToRegisterOrderParams = (
  formData: FormData,
): Omit<RegisterOrderParams, "dbClient"> => {
  const customerName = String(formData.get("customerName") ?? "").trim()
  const productIdEntries = formData.getAll("items[][productId]")
  const quantityEntries = formData.getAll("items[][quantity]")
  if (productIdEntries.length !== quantityEntries.length) {
    throw createInvalidFormDataError()
  }
  const orderItems = productIdEntries
    .map((productId, index) => {
      const quantity = Number(quantityEntries[index])
      const parsedProductId = Number(productId)
      if (!Number.isInteger(parsedProductId) || !Number.isInteger(quantity)) {
        throw createInvalidFormDataError()
      }
      return {
        productId: parsedProductId,
        quantity,
      }
    })
    .filter((item) => item.quantity > 0)

  return {
    order: {
      customerName: customerName.length > 0 ? customerName : null,
      orderItems,
    },
  }
}

export const POST = createRoute(async (c) => {
  try {
    const formData = await c.req.formData()
    const { order } = orderFormDataToRegisterOrderParams(formData)
    await registerOrder({ dbClient: c.get("dbClient"), order })

    setToastCookie(c, "success", "注文を登録しました")
  } catch (e) {
    setToastCookie(c, "error", String(e))
  }
  return c.redirect(c.req.url)
})

export default createRoute(async (c) => {
  const { products, tags } = await getOrderRegistrationPageData({
    dbClient: c.get("dbClient"),
  })

  // TODO: 動作確認用
  const orders = await findAllOrders({
    dbClient: c.get("dbClient"),
  })

  return c.render(
    <Layout title={"注文登録"} description={"注文情報の登録を行います。"}>
      <div className="rounded-lg border bg-bg p-6">
        <h2 className="mb-4 font-bold text-lg">注文登録</h2>
        <OrderRegister products={products} tags={tags} />
      </div>
      {JSON.stringify(orders)}
    </Layout>,
  )
})
