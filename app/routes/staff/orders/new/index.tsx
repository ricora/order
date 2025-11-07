import { createRoute } from "honox/factory"
import { setToastCookie } from "../../../../helpers/ui/toast"
import {
  type RegisterOrderParams,
  registerOrder,
} from "../../../../usecases/registerOrder"
import Layout from "../../-components/layout"
import OrderRegistrationForm from "./-components/$orderRegistrationForm"

const createInvalidFormDataError = () => {
  return new Error("不正なリクエストです")
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
  const orderItems = productIdEntries.map((productId, index) => {
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
  return c.render(
    <Layout title={"注文登録"} description={"注文情報の登録を行います。"}>
      <div className="rounded-lg border bg-bg p-6">
        <h2 className="mb-4 font-bold text-lg">注文登録</h2>
        <OrderRegistrationForm />
      </div>
    </Layout>,
  )
})
