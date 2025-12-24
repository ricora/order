import { validator } from "hono/validator"
import { createRoute } from "honox/factory"
import { setProductDetails } from "../../../../../usecases/commands/setProductDetails"
import { getProductEditPageData } from "../../../../../usecases/queries/getProductEditPageData"
import { setToastCookie } from "../../../../-helpers/ui/toast"
import Layout from "../../../-components/layout"
import ProductRegistrationForm from "../../-components/$productRegistrationForm"
import { parseProductRegistrationFormData } from "../../-helpers/parseProductRegistrationFormData"

export const POST = createRoute(
  validator("form", async (value, c) => {
    const parsed = await parseProductRegistrationFormData(value)
    if (parsed === null) {
      setToastCookie(c, "error", "不正なリクエストです")
      return c.redirect(c.req.url)
    }
    return { product: parsed }
  }),
  async (c) => {
    const id = Number(c.req.param("id"))
    if (!Number.isInteger(id) || id <= 0) {
      return c.notFound()
    }

    const { product } = c.req.valid("form")
    const res = await setProductDetails({
      dbClient: c.get("dbClient"),
      product: { id, ...product },
    })
    if (!res.ok) {
      setToastCookie(c, "error", res.message)
      return c.redirect(c.req.url)
    }
    setToastCookie(c, "success", "商品を更新しました")
    return c.redirect("/staff/products")
  },
)

export default createRoute(async (c) => {
  const idParam = c.req.param("id")
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    return c.notFound()
  }

  const res = await getProductEditPageData({
    product: { id },
    dbClient: c.get("dbClient"),
  })
  if (!res.ok) {
    if (res.message === "商品が見つかりません。") return c.notFound()
    throw new Error(res.message)
  }
  const { product } = res.value
  if (!product) return c.notFound()

  return c.render(
    <Layout title={"商品編集"} description={"商品情報の編集を行います。"}>
      <ProductRegistrationForm initialValues={product} mode="edit" />
    </Layout>,
  )
})
