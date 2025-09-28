import { createRoute } from "honox/factory"
import { setToastCookie } from "../../../helpers/ui/toast"
import { getProductsManagementPageData } from "../../../usecases/getProductsManagementPageData"
import {
  type RegisterProductParams,
  registerProduct,
} from "../../../usecases/registerProduct"
import { countStringLength } from "../../../utils/text"
import Layout from "../-components/layout"
import ProductCardView from "./-components/productCardView"
import ProductInfo from "./-components/productInfo"
import ProductRegister from "./-components/productRegister"
import ProductTableView from "./-components/productTableView"
import ViewModeToggle from "./-components/viewModeToggle"

const productFormDataToRegisterProductParams = (
  formData: FormData,
): RegisterProductParams["product"] => {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("商品名は必須です")
  if (countStringLength(name) < 1 || countStringLength(name) > 50)
    throw new Error("商品名は1文字以上50文字以内で入力してください")

  const image = String(formData.get("image") ?? "").trim()
  if (image) {
    if (!/^https?:\/\/.+/i.test(image) || countStringLength(image) > 500) {
      throw new Error("画像URLは500文字以内かつhttp(s)で始まる必要があります")
    }
  }

  const price = Number(formData.get("price"))
  if (Number.isNaN(price) || price < 0 || !Number.isInteger(price)) {
    throw new Error("価格は0以上の整数で入力してください")
  }

  const stock = Number(formData.get("stock"))
  if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    throw new Error("在庫数は0以上の整数で入力してください")
  }

  const tags = (formData.getAll("tags") as string[])
    .map((t) => t.trim())
    .filter(Boolean)
  return {
    name,
    image,
    tags,
    price,
    stock,
  }
}

export const POST = createRoute(async (c) => {
  try {
    const formData = await c.req.formData()
    const product = productFormDataToRegisterProductParams(formData)
    await registerProduct({ dbClient: c.get("dbClient"), product })

    setToastCookie(c, "success", "商品を登録しました")
  } catch (e) {
    setToastCookie(c, "error", String(e))
  }
  return c.redirect(c.req.url)
})

export default createRoute(async (c) => {
  const url = new URL(c.req.url)
  const viewMode = c.req.query("view") === "card" ? "card" : "table"
  const search = url.search

  const {
    products,
    tags,
    totalProducts,
    outOfStockCount,
    lowStockCount,
    totalValue,
  } = await getProductsManagementPageData({ dbClient: c.get("dbClient") })

  return c.render(
    <Layout title={"商品管理"} description={"商品情報の登録や編集を行います。"}>
      <ProductInfo
        totalProducts={totalProducts}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
        totalValue={totalValue}
      />
      <ProductRegister tags={tags} />
      <div className="rounded-lg border bg-bg p-4">
        <div className="mb-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-bold text-lg">商品一覧</span>
          <div className="flex justify-end">
            <ViewModeToggle viewMode={viewMode} search={search} />
          </div>
        </div>
        {viewMode === "table" ? (
          <ProductTableView products={products} />
        ) : (
          <ProductCardView products={products} />
        )}
      </div>
    </Layout>,
  )
})
