import type Order from "./entities/order"

export const ORDER_STATUSES: Order["status"][] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
]
