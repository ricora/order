import type { FC } from "hono/jsx"
import type { Order } from "../../../../../domain/order/entities"
import { formatDateTimeJP } from "../../../../../utils/date"
import { formatCurrencyJPY } from "../../../../../utils/money"
import OrderStatusBadge from "../../-components/orderStatusBadge"

const OrderSummary: FC<{
  order: Order
}> = ({ order }) => {
  return (
    <div class="rounded-lg border p-4">
      <div class="flex items-start gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <div class="text-muted-foreground text-sm">
              <span class="font-semibold text-lg">#{order.id}</span>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div class="mt-1 text-muted-foreground text-sm">
            登録日時 {formatDateTimeJP(order.createdAt)}
          </div>
          <div class="mt-1 text-muted-foreground text-sm">
            更新日時 {formatDateTimeJP(order.updatedAt)}
          </div>

          <div class="mt-1 text-muted-foreground text-sm">
            顧客名 {order.customerName ?? "-"}
          </div>

          {order.comment && (
            <div class="mt-2">
              <div class="font-semibold">コメント</div>
              <div class="mt-2 rounded border border-border bg-bg p-2">
                <p class="break-word whitespace-pre-wrap text-sm">
                  {order.comment}
                </p>
              </div>
            </div>
          )}
          <div class="mt-2">
            <div class="font-semibold">注文内容</div>
            <div class="my-2 space-y-1">
              {order.orderItems.map((item) => (
                <div class="flex items-center justify-between rounded border border-border/50 bg-muted px-2 py-1">
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-medium text-sm">
                      {item.productName}
                    </div>
                  </div>
                  <div class="ml-4 text-sm">×{item.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          <div class="mt-1">
            合計{" "}
            <span class="font-mono">
              {formatCurrencyJPY(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
