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
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-white rounded-lg border p-4 flex flex-col">
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium">総商品数</span>

        <div className="h-4 w-4 text-gray-400">
          <PackageIcon />
        </div>
      </div>
      <div className="text-2xl font-bold">{totalProducts}</div>
      <p className="text-xs text-gray-400 mt-1">登録済み商品</p>
    </div>
    <div className="bg-white rounded-lg border p-4 flex flex-col">
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium">在庫切れ</span>
        <div className="h-4 w-4 text-red-500">
          <TriangleAlertIcon />
        </div>
      </div>
      <div className="text-2xl font-bold text-red-500">{outOfStockCount}</div>
      <p className="text-xs text-gray-400 mt-1">要補充商品</p>
    </div>
    <div className="bg-white rounded-lg border p-4 flex flex-col">
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium">残りわずか</span>
        <div className="h-4 w-4 text-yellow-600">
          <TrendingUpIcon />
        </div>
      </div>
      <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
      <p className="text-xs text-gray-400 mt-1">在庫5個以下</p>
    </div>
    <div className="bg-white rounded-lg border p-4 flex flex-col">
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium">在庫総額</span>
        <div className="h-4 w-4 text-gray-400">
          <PackageIcon />
        </div>
      </div>
      <div className="text-2xl font-bold">
        {new Intl.NumberFormat("ja-JP", {
          style: "currency",
          currency: "JPY",
        }).format(totalValue)}
      </div>
      <p className="text-xs text-gray-400 mt-1">現在の在庫価値</p>
    </div>
  </div>
)

export default ProductInfo
