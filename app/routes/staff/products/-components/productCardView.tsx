import SquarePenIcon from "../../../../components/icons/lucide/squarePenIcon"
import Trash2Icon from "../../../../components/icons/lucide/trash2Icon"
import type { ProductsManagementPageData } from "../../../../usecases/getProductsManagementPageData"
import { StockStatusLabel } from "./stockStatusLabel"

const formatPrice = (price: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(price)

const ProductsNotRegistered = () => (
  <div className="py-12 text-center">
    <div className="text-lg text-muted-fg">商品が登録されていません</div>
  </div>
)

const ProductCard = ({
  product,
}: {
  product: ProductsManagementPageData["products"][number]
}) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-bg shadow transition-shadow hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image || "/placeholder.svg?height=300&width=300"}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <StockStatusLabel stock={product.stock} />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-2 font-semibold text-lg">
              {product.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border bg-muted px-2 py-0.5 text-muted-fg text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="font-bold text-2xl">
              {formatPrice(product.price)}
            </div>
            <div className="text-right">
              <div className="text-muted-fg text-sm">在庫</div>
              <div className="font-mono font-semibold">{product.stock}個</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default ProductCardView
