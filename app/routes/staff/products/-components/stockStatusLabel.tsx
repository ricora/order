import { tv } from "tailwind-variants"
import TriangleAlertIcon from "../../../../components/icons/lucide/triangleAlertIcon"
import { getStockStatusLabel, type StockStatus } from "../-utils/stock"

const stockStatusLabel = tv({
  slots: {
    base: "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold",
    alertIcon: "h-3 w-3 mr-1",
  },
  variants: {
    status: {
      "out-of-stock": { base: "bg-red-100 text-red-700" },
      "low-stock": {
        base: "bg-yellow-100 text-yellow-700",
        alertIcon: "hidden",
      },
      "in-stock": { base: "bg-gray-100 text-gray-700", alertIcon: "hidden" },
    } satisfies Record<StockStatus, unknown>,
  },
})

export const StockStatusLabel = ({ status }: { status: StockStatus }) => {
  const { base, alertIcon } = stockStatusLabel({ status })

  return (
    <span className={base()}>
      <div className={alertIcon()}>
        <TriangleAlertIcon />
      </div>
      {getStockStatusLabel(status)}
    </span>
  )
}
