import type { FC } from "hono/jsx"
import type Order from "../../../../../domain/order/entities/order"
import { formatDateTimeJP } from "../../../../../utils/date"
import { formatCurrencyJPY } from "../../../../../utils/money"
import OrderStatusBadge from "../../-components/orderStatusBadge"

const OrderSummary: FC<{
  order: Order
}> = ({ order }) => {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground text-sm">
              <span className="font-semibold text-lg">#{order.id}</span>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-1 text-muted-foreground text-sm">
            登録日時 {formatDateTimeJP(order.createdAt)}
          </div>
          <div className="mt-1 text-muted-foreground text-sm">
            更新日時 {formatDateTimeJP(order.updatedAt)}
          </div>

          <div className="mt-1 text-muted-foreground text-sm">
            顧客名 {order.customerName ?? "-"}
          </div>

          <div className="my-2 space-y-1">
            {order.orderItems.map((item) => (
              <div className="flex items-center justify-between rounded border border-border/50 bg-muted px-2 py-1">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-sm">
                    {item.productName}
                  </div>
                </div>
                <div className="ml-4 text-sm">×{item.quantity}</div>
              </div>
            ))}
          </div>
          <div className="mt-1">
            合計{" "}
            <span className="font-mono">
              {formatCurrencyJPY(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
