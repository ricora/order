import type { OrderStatus } from "./entities/order"

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
]
