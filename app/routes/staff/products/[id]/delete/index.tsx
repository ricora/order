import { createRoute } from "honox/factory"
import ChevronLeftIcon from "../../../../../components/icons/lucide/chevronLeftIcon"
import Trash2Icon from "../../../../../components/icons/lucide/trash2Icon"
import Button from "../../../../../components/ui/button"
import Chip from "../../../../../components/ui/chip"
import LinkButton from "../../../../../components/ui/linkButton"
import { findAllProductTagsByIds } from "../../../../../domain/product/repositories/productTagQueryRepository"
import { setToastCookie } from "../../../../../helpers/ui/toast"
import type { TransactionDbClient } from "../../../../../infrastructure/db/client"
import { getProductEditPageData } from "../../../../../usecases/getProductEditPageData"
import { removeProduct } from "../../../../../usecases/removeProduct"
import { formatCurrencyJPY } from "../../../../../utils/money"
import Layout from "../../../-components/layout"

export const POST = createRoute(async (c) => {
  try {
    const id = Number(c.req.param("id"))
    if (!Number.isInteger(id) || id <= 0) {
      return c.notFound()
    }

    await removeProduct({
      dbClient: c.get("dbClient"),
      product: { id },
    })

    setToastCookie(c, "success", "商品を削除しました")
    return c.redirect("/staff/products")
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
  const tags = await findAllProductTagsByIds({
    dbClient: c.get("dbClient") as unknown as TransactionDbClient,
    productTag: { ids: product.tagIds },
    pagination: { offset: 0, limit: product.tagIds.length },
  })

  return c.render(
    <Layout title={"商品削除"} description={"商品情報の削除を行います。"}>
      <div className="rounded-lg border bg-bg p-6">
        <h1 className="font-semibold text-lg">商品削除</h1>
        <p className="mt-2 text-sm">
          商品「{product.name}
          」を削除してもよろしいですか？この操作は取り消せません。
        </p>

        <div className="mt-4 rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <img
              src={`/images/products/${product.id}`}
              alt={product.name}
              className="h-16 w-16 rounded"
            />
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="mt-1 text-muted-foreground text-sm">
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Chip key={tag.id} size="xs">
                      {tag.name}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="font-mono">
                {formatCurrencyJPY(product.price)}
              </div>
              <div className="text-sm">在庫: {product.stock}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <LinkButton href="/staff/products" leftIcon={ChevronLeftIcon}>
              商品管理に戻る
            </LinkButton>
          </div>
          <div>
            <form method="post">
              <div>
                <Button type="submit" variant="danger" leftIcon={Trash2Icon}>
                  削除する
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>,
  )
})
