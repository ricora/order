import { createRoute } from "honox/factory"
import Chip from "../../../components/ui/chip"
import ItemCollectionViewer from "../../../components/ui/itemCollectionViewer"
import { setToastCookie } from "../../../helpers/ui/toast"
import { getProductsManagementPageData } from "../../../usecases/getProductsManagementPageData"
import { registerProduct } from "../../../usecases/registerProduct"
import { formatCurrencyJPY } from "../../../utils/money"
import Layout from "../-components/layout"
import ProductRegistrationForm from "./-components/$productRegistrationForm"
import ProductInfo from "./-components/productInfo"
import StockStatusLabel from "./-components/stockStatusLabel"
import { parseProductRequestBody } from "./-helpers/parseRequestBody"

export const POST = createRoute(async (c) => {
  try {
    const body = await c.req.parseBody({ all: true })
    const { name, image, price, stock, tags } = parseProductRequestBody(body)

    await registerProduct({
      dbClient: c.get("dbClient"),
      product: {
        name,
        image,
        price,
        stock,
        tags,
      },
    })

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

  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10))

  const {
    products,
    totalProducts,
    outOfStockCount,
    lowStockCount,
    totalValue,
  } = await getProductsManagementPageData({
    dbClient: c.get("dbClient"),
    page,
  })

  return c.render(
    <Layout title={"商品管理"} description={"商品情報の登録や編集を行います。"}>
      <ProductInfo
        totalProducts={totalProducts}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
        totalValue={totalValue}
      />
      <ProductRegistrationForm />
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
