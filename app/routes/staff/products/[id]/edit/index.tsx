import { validator } from "hono/validator"
import { createRoute } from "honox/factory"
import { setToastCookie } from "../../../../../helpers/ui/toast"
import { getProductEditPageData } from "../../../../../usecases/getProductEditPageData"
import { registerProduct } from "../../../../../usecases/registerProduct"
import Layout from "../../../-components/layout"
import ProductRegistrationForm from "../../-components/$productRegistrationForm"
import { parseUpdateProductRequestBody } from "../../-helpers/parseRequestBody"

export const POST = createRoute(
  validator("form", async (value, c) => {
    try {
      const parsed = await parseUpdateProductRequestBody(value)
      return parsed
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

      const parsedProduct = c.req.valid("form")

      await registerProduct({
        dbClient: c.get("dbClient"),
        product: { id, ...parsedProduct },
      })

      setToastCookie(c, "success", "商品を更新しました")
      return c.redirect(`/staff/products`)
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
