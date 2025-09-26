import PackageIcon from "../../../../components/icons/lucide/packageIcon"
import TrendingUpIcon from "../../../../components/icons/lucide/trendingUpIcon"
import TriangleAlertIcon from "../../../../components/icons/lucide/triangleAlertIcon"

type ProductInfoProps = {
  totalProducts: number
  outOfStockCount: number
  lowStockCount: number
  totalValue: number
}

const ProductInfo = ({
  totalProducts,
  outOfStockCount,
  lowStockCount,
  totalValue,
}: ProductInfoProps) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <div className="flex flex-col rounded-lg border bg-bg p-4">
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="font-medium text-sm">総商品数</span>

        <div className="h-4 w-4 text-muted-fg">
          <PackageIcon />
        </div>
      </div>
      <div className="font-bold text-2xl">{totalProducts}</div>
      <p className="mt-1 text-muted-fg text-xs">登録済み商品</p>
    </div>
    <div className="flex flex-col rounded-lg border border-danger bg-danger-subtle p-4">
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="font-medium text-danger-subtle-fg text-sm">在庫切れ</span>
        <div className="h-4 w-4 text-danger-subtle-fg">
          <TriangleAlertIcon />
        </div>
      </div>
      <div className="font-bold text-2xl text-danger-subtle-fg">{outOfStockCount}</div>
      <p className="mt-1 text-muted-fg text-xs">要補充商品</p>
    </div>
    <div className="flex flex-col rounded-lg border border-warning bg-warning-subtle p-4">
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="font-medium text-sm">残りわずか</span>
        <div className="h-4 w-4 text-warning">
          <TrendingUpIcon />
        </div>
      </div>
      <div className="font-bold text-2xl text-warning">{lowStockCount}</div>
      <p className="mt-1 text-muted-fg text-xs">在庫5個以下</p>
    </div>
    <div className="flex flex-col rounded-lg border bg-bg p-4">
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="font-medium text-sm">在庫総額</span>
        <div className="h-4 w-4 text-muted-fg">
          <PackageIcon />
        </div>
      </div>
      <div className="font-bold text-2xl">
        {new Intl.NumberFormat("ja-JP", {
          style: "currency",
          currency: "JPY",
        }).format(totalValue)}
      </div>
      <p className="mt-1 text-muted-fg text-xs">現在の在庫価値</p>
    </div>
  </div>
)

export default ProductInfo
