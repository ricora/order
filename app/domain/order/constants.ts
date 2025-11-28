import type Order from "./entities/order"

/** 注文のステータス */
export const ALLOWED_ORDER_STATUSES = new Set<Order["status"]>([
  "pending",
  "processing",
  "completed",
  "cancelled",
])
