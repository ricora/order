import type Order from "../domain/order/entities/order"
import { findAllOrders } from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { toCsv } from "../utils/csv"

export const ORDER_HISTORY_EXPORT_PAGE_SIZE = 200

const ORDER_HISTORY_HEADER = [
  "order_id",
  "order_created_at",
  "order_updated_at",
  "order_status",
  "customer_name",
  "order_total_amount",
  "order_item_count",
  "line_index",
  "product_id",
  "product_name",
  "unit_amount",
  "quantity",
  "line_total_amount",
]

export type ExportOrderHistoryCsvParams = {
  dbClient: DbClient
}

export type ExportOrderHistoryCsvResult = {
  csv: string
  exportedAt: Date
  orderCount: number
  rowCount: number
}

const fetchAllOrders = async (dbClient: DbClient): Promise<Order[]> => {
  const orders: Order[] = []
  // fetch in deterministic order by primary key via existing repository
  while (true) {
    const chunk = await findAllOrders({
      dbClient,
      pagination: {
        offset: orders.length,
        limit: ORDER_HISTORY_EXPORT_PAGE_SIZE,
      },
    })
    orders.push(...chunk)
    if (chunk.length < ORDER_HISTORY_EXPORT_PAGE_SIZE) {
      break
    }
  }
  return orders
}

const buildOrderRows = (orders: Order[]) => {
  const rows: (string | number | Date | null | undefined)[][] = []

  for (const order of orders) {
    const itemCount = order.orderItems.length
    if (itemCount === 0) {
      rows.push([
        order.id,
        order.createdAt,
        order.updatedAt,
        order.status,
        order.customerName ?? "",
        order.totalAmount,
        0,
        0,
        "",
        "",
        "",
        0,
        0,
      ])
      continue
    }

    order.orderItems.forEach((item, index) => {
      rows.push([
        order.id,
        order.createdAt,
        order.updatedAt,
        order.status,
        order.customerName ?? "",
        order.totalAmount,
        itemCount,
        index + 1,
        item.productId ?? "",
        item.productName,
        item.unitAmount,
        item.quantity,
        item.unitAmount * item.quantity,
      ])
    })
  }

  return rows
}

export const exportOrderHistoryCsv = async ({
  dbClient,
}: ExportOrderHistoryCsvParams): Promise<ExportOrderHistoryCsvResult> => {
  const orders = await fetchAllOrders(dbClient)
  const rows = buildOrderRows(orders)
  const csvRows =
    rows.length > 0 ? [ORDER_HISTORY_HEADER, ...rows] : [ORDER_HISTORY_HEADER]
  const csv = toCsv(csvRows)
  return {
    csv,
    exportedAt: new Date(),
    orderCount: orders.length,
    rowCount: rows.length,
  }
}
