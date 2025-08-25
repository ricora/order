import SquarePenIcon from "../../../../components/icons/lucide/squarePenIcon"
import Trash2Icon from "../../../../components/icons/lucide/trash2Icon"
import type { ProductsManagementPageData } from "../../../../usecases/getProductsManagementPageData"
import { getStockStatus } from "../-utils/stock"
import { StockStatusLabel } from "./stockStatusLabel"

const formatPrice = (price: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(price)

const ProductsNotRegistered = () => (
  <div className="text-center py-12">
    <div className="text-gray-400 text-lg">商品が登録されていません</div>
  </div>
)

const ProductCard = ({
  product,
}: {
  product: ProductsManagementPageData["products"][number]
}) => {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img
          src={product.image || "/placeholder.svg?height=300&width=300"}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <StockStatusLabel status={getStockStatus(product.stock)} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">
              {product.name}
            </h3>
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="border rounded px-2 py-0.5 text-xs text-gray-600 bg-gray-50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(product.price)}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">在庫</div>
              <div className="font-mono font-semibold">{product.stock}個</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
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
      </div>
    </div>
  )
}

type ProductCardViewProps = {
  products: ProductsManagementPageData["products"]
}

const ProductCardView = ({ products }: ProductCardViewProps) => {
  if (products.length === 0) {
    return <ProductsNotRegistered />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default ProductCardView
