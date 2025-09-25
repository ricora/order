import type { FC } from "hono/jsx"
import SquarePenIcon from "../../../../components/icons/lucide/squarePenIcon"
import Trash2Icon from "../../../../components/icons/lucide/trash2Icon"
import type { ProductsManagementPageData } from "../../../../usecases/getProductsManagementPageData"
import { StockStatusLabel } from "./stockStatusLabel"

type ProductTableViewProps = {
  products: ProductsManagementPageData["products"]
}

const ProductTableRow = ({
  product,
}: {
  product: ProductsManagementPageData["products"][number]
}) => {
  return (
    <tr>
      <td className="w-16 min-w-16 px-2 py-2 align-middle">
        <img
          src={product.image || "/placeholder.svg?height=60&width=60"}
          alt={product.name}
          className="h-12 min-h-12 w-12 min-w-12 rounded-md border object-cover"
          loading="lazy"
        />
      </td>
      <td className="px-4 py-2 align-middle font-medium">{product.name}</td>
      <td className="px-4 py-2 align-middle">
        <div className="flex flex-wrap gap-1">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="whitespace-nowrap rounded border bg-muted px-2 py-0.5 text-muted-fg text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-2 text-right align-middle font-mono">
        {new Intl.NumberFormat("ja-JP", {
          style: "currency",
          currency: "JPY",
        }).format(product.price)}
      </td>
      <td className="px-4 py-2 text-center align-middle font-mono">
        {product.stock}
      </td>
      <td className="px-4 py-2 text-center align-middle">
        <StockStatusLabel stock={product.stock} />
      </td>
      <td className="px-4 py-2 align-middle">
        <div className="flex flex-col items-center gap-2">
          <a
            href={`/staff/products/${product.id}/edit`}
            className="flex flex-1 items-center justify-center gap-2 rounded border bg-bg px-3 py-2 font-medium text-fg text-sm transition hover:bg-muted"
          >
            <div className="h-4 w-4">
              <SquarePenIcon />
            </div>
            編集
          </a>
          <a
            href={`/staff/products/${product.id}/delete`}
            className="flex flex-1 items-center justify-center gap-2 rounded border bg-bg px-3 py-2 font-medium text-danger-subtle-fg text-sm transition hover:border-danger-subtle hover:bg-danger-subtle"
          >
            <div className="h-4 w-4">
              <Trash2Icon />
            </div>
            削除
          </a>
        </div>
      </td>
    </tr>
  )
}

const ProductTableView: FC<ProductTableViewProps> = ({ products }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-3xl rounded-md border bg-bg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="w-16 px-4 py-2 text-left font-medium text-muted-fg text-xs uppercase tracking-wider">
                画像
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-fg text-xs uppercase tracking-wider">
                商品名
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-fg text-xs uppercase tracking-wider">
                タグ
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-fg text-xs uppercase tracking-wider">
                価格
              </th>
              <th className="px-4 py-2 text-center font-medium text-muted-fg text-xs uppercase tracking-wider">
                在庫
              </th>
              <th className="px-4 py-2 text-center font-medium text-muted-fg text-xs uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-4 py-2 text-center font-medium text-muted-fg text-xs uppercase tracking-wider">
                編集
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-bg">
            {products.length ? (
              products.map((product) => (
                <ProductTableRow key={product.id} product={product} />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="h-24 text-center">
                  データがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProductTableView
