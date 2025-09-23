import { tv } from "tailwind-variants"
import TriangleAlertIcon from "../../../../components/icons/lucide/triangleAlertIcon"

const getStockStatus = (stock: number) => {
  if (stock === 0) {
    return "out-of-stock"
  }
  if (stock <= 5) {
    return "low-stock"
  }
  return "in-stock"
}

type StockStatus = ReturnType<typeof getStockStatus>

const getStockStatusLabel = (status: StockStatus) => {
  switch (status) {
    case "out-of-stock":
      return "在庫切れ"
    case "low-stock":
      return "残りわずか"
    case "in-stock":
      return "在庫あり"
  }
}

const stockStatusLabel = tv({
  slots: {
    base: "inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-xs",
    alertIcon: "mr-1 h-3 w-3",
  },
  variants: {
    status: {
      "out-of-stock": { base: "bg-danger-subtle text-danger" },
      "low-stock": {
        base: "bg-warning-subtle text-warning-subtle-fg",
        alertIcon: "hidden",
      },
      "in-stock": {
        base: "bg-success-subtle text-success-subtle-fg",
        alertIcon: "hidden",
      },
    } satisfies Record<StockStatus, unknown>,
  },
})

export const StockStatusLabel = ({ stock }: { stock: number }) => {
  const status = getStockStatus(stock)
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
