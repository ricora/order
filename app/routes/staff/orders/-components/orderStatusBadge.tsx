import Badge from "../../../-components/ui/badge"

const statusLabel: Record<string, string> = {
  pending: "処理待ち",
  processing: "処理中",
  completed: "完了",
  cancelled: "取消済",
}

const statusVariantMap: Record<
  string,
  "danger" | "warning" | "success" | "info"
> = {
  pending: "danger",
  processing: "warning",
  completed: "success",
  cancelled: "info",
}

type OrderStatusBadgeProps = {
  status: "pending" | "processing" | "completed" | "cancelled"
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  return (
    <Badge variant={statusVariantMap[status]}>
      {statusLabel[status] ?? status}
    </Badge>
  )
}

export default OrderStatusBadge
