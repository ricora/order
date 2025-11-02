import { createRoute } from "honox/factory"
import Chip from "../../../components/ui/chip"
import ItemCollectionViewer from "../../../components/ui/itemCollectionViewer"
import { setToastCookie } from "../../../helpers/ui/toast"
import { getProductsManagementPageData } from "../../../usecases/getProductsManagementPageData"
import {
  type RegisterProductParams,
  registerProduct,
} from "../../../usecases/registerProduct"
import { formatCurrencyJPY } from "../../../utils/money"
import { countStringLength } from "../../../utils/text"
import Layout from "../-components/layout"
import ProductRegistrationForm from "./-components/$productRegistrationForm"
import ProductInfo from "./-components/productInfo"
import StockStatusLabel from "./-components/stockStatusLabel"

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
  if (!Number.isInteger(price) || price < 0) {
    throw new Error("価格は0以上の整数で入力してください")
  }

  const stock = Number(formData.get("stock"))
  if (!Number.isInteger(stock) || stock < 0) {
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
  const urlSearch = url.search

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
      <ProductRegistrationForm tags={tags} />
      <ItemCollectionViewer
        title="商品一覧"
        columns={[
          { header: "画像", align: "left" },
          { header: "商品名", align: "left" },
          { header: "タグ", align: "left" },
          { header: "価格", align: "right" },
          { header: "在庫", align: "center" },
          { header: "ステータス", align: "center" },
        ]}
        items={products.map((product) => ({
          id: product.id,
          fields: [
            { type: "image", src: product.image, alt: product.name },
            { type: "text", value: product.name },
            {
              type: "custom",
              content: (
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <Chip key={tag} size="xs">
                      {tag}
                    </Chip>
                  ))}
                </div>
              ),
            },
            {
              type: "custom",
              content: (
                <span className="font-mono">
                  {formatCurrencyJPY(product.price)}
                </span>
              ),
            },
            { type: "number", value: product.stock },
            {
              type: "custom",
              content: <StockStatusLabel stock={product.stock} />,
            },
          ],
          editUrl: `/staff/products/${product.id}/edit`,
          deleteUrl: `/staff/products/${product.id}/delete`,
        }))}
        viewMode={viewMode}
        urlSearch={urlSearch}
        emptyMessage="商品が登録されていません"
      />
    </Layout>,
  )
})
