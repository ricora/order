import { createRoute } from "honox/factory"
import { setToastCookie } from "../../../../../helpers/ui/toast"
import { getProductEditPageData } from "../../../../../usecases/getProductEditPageData"
import { registerProduct } from "../../../../../usecases/registerProduct"
import Layout from "../../../../staff/-components/layout"
import ProductRegistrationForm from "../../-components/$productRegistrationForm"

const createInvalidRequestError = () => {
  return new Error("不正なリクエストです")
}

export const POST = createRoute(async (c) => {
  try {
    const id = Number(c.req.param("id"))
    if (!Number.isInteger(id) || id <= 0) throw createInvalidRequestError()

    const body = await c.req.parseBody({ all: true })

    const name = body.name
    if (typeof name !== "string") throw createInvalidRequestError()

    const image = body.image
    if (typeof image !== "string") throw createInvalidRequestError()

    const price = Number(body.price)
    if (typeof price !== "number" || !Number.isInteger(price) || price < 0) {
      throw createInvalidRequestError()
    }

    const stock = Number(body.stock)
    if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
      throw createInvalidRequestError()
    }

    const rawTags = body.tags
    const tags =
      rawTags === undefined
        ? undefined
        : typeof rawTags === "string"
          ? [rawTags]
          : Array.isArray(rawTags) &&
              rawTags.every((t) => typeof t === "string")
            ? rawTags
            : (() => {
                throw createInvalidRequestError()
              })()

    await registerProduct({
      dbClient: c.get("dbClient"),
      product: { id, name, image, price, stock, tags },
    })

    setToastCookie(c, "success", "商品を更新しました")
    return c.redirect(`/staff/products`)
  } catch (e) {
    setToastCookie(c, "error", String(e))
    return c.redirect(c.req.url)
  }
})

export default createRoute(async (c) => {
  const idParam = c.req.param("id")
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    return c.text("Not found", 404)
  }

  const { product } = await getProductEditPageData({
    product: { id },
    dbClient: c.get("dbClient"),
  })
  if (!product) return c.text("Not found", 404)

  return c.render(
    <Layout title={"商品編集"} description={"商品情報の編集を行います。"}>
      <ProductRegistrationForm initialValues={product} mode="edit" />
    </Layout>,
  )
})
