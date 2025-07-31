import type { FC } from "hono/jsx"
import type { Product } from "../-types/product"
import SquarePenIcon from "../../../../components/icons/lucide/squarePenIcon"
import Trash2Icon from "../../../../components/icons/lucide/trash2Icon"
import TriangleAlertIcon from "../../../../components/icons/lucide/triangleAlertIcon"

type ProductTableViewProps = {
  products: Product[]
}

const getStockStatus = (stock: number) => {
  if (stock === 0)
    return {
      variant: "bg-red-100 text-red-700",
      text: "在庫切れ",
      showIcon: true,
    }
  if (stock <= 5)
    return {
      variant: "bg-yellow-100 text-yellow-700",
      text: "残りわずか",
      showIcon: false,
    }
  return {
    variant: "bg-gray-100 text-gray-700",
    text: "在庫あり",
    showIcon: false,
  }
}

const ProductTableView: FC<ProductTableViewProps> = ({ products }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="rounded-md border min-w-3xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-16 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                画像
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品名
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タグ
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                価格
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                在庫
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                編集
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {products.length ? (
              products.map((product) => {
                const stockStatus = getStockStatus(product.stock)
                return (
                  <tr key={product.id}>
                    <td className="w-16 min-w-16 px-2 py-2 align-middle">
                      <img
                        src={
                          product.image || "/placeholder.svg?height=60&width=60"
                        }
                        alt={product.name}
                        className="w-12 h-12 min-w-12 min-h-12 object-cover rounded-md border"
                        loading="lazy"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle font-medium">
                      {product.name}
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className="border rounded px-2 py-0.5 text-xs text-gray-600 bg-gray-50 whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-middle font-mono text-right">
                      {new Intl.NumberFormat("ja-JP", {
                        style: "currency",
                        currency: "JPY",
                      }).format(product.price)}
                    </td>
                    <td className="px-4 py-2 align-middle text-center font-mono">
                      {product.stock}
                    </td>
                    <td className="px-4 py-2 align-middle text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${stockStatus.variant}`}
                      >
                        {stockStatus.showIcon && (
                          <div className="h-3 w-3 mr-1">
                            <TriangleAlertIcon />
                          </div>
                        )}
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col gap-2 items-center">
                        <a
                          href={`/staff/products/${product.id}/edit`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition"
                        >
                          <div className="h-4 w-4">
                            <SquarePenIcon />
                          </div>
                          編集
                        </a>
                        <a
                          href={`/staff/products/${product.id}/delete`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border bg-white hover:bg-red-50 text-red-600 text-sm font-medium transition"
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
              })
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
