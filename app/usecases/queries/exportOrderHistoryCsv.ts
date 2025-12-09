import type { Order } from "../../domain/order/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { toCsv } from "../../utils/csv"
import { formatDateTimeIsoJP } from "../../utils/date"
import { orderRepository } from "../repositories-provider"

const { findAllOrdersOrderByIdAsc } = orderRepository

export const ORDER_HISTORY_EXPORT_PAGE_SIZE = 200

export const ORDER_HISTORY_COLUMNS = [
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
] as const

export const ORDER_HISTORY_HEADER = ORDER_HISTORY_COLUMNS

export type ExportOrderHistoryCsvParams = {
  dbClient: DbClient
}

export type ExportOrderHistoryCsvResult = {
  csv: string
  exportedAt: Date
  orderCount: number
  rowCount: number
}

const fetchAllOrders = async (
  dbClient: DbClient,
): Promise<Result<Order[], "エラーが発生しました。">> => {
  const orders: Order[] = []
  const pageSize = ORDER_HISTORY_EXPORT_PAGE_SIZE
  const limit = pageSize + 1

  // fetch in deterministic order by primary key via existing repository
  while (true) {
    const chunkResult = await findAllOrdersOrderByIdAsc({
      dbClient,
      pagination: {
        offset: orders.length,
        limit,
      },
    })
    if (!chunkResult.ok) {
      return { ok: false, message: "エラーが発生しました。" }
    }
    const chunk = chunkResult.value
    if (chunk.length === 0) {
      break
    }

    const hasNextPage = chunk.length > pageSize
    const rowsToAppend = hasNextPage ? chunk.slice(0, pageSize) : chunk
    orders.push(...rowsToAppend)

    if (!hasNextPage) {
      break
    }
  }
  return { ok: true, value: orders }
}

const buildOrderRows = (orders: Order[]) => {
  const rows: (string | number | Date | null | undefined)[][] = []

  for (const order of orders) {
    const itemCount = order.orderItems.length
    if (itemCount === 0) {
      rows.push([
        order.id,
        formatDateTimeIsoJP(order.createdAt),
        formatDateTimeIsoJP(order.updatedAt),
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
        formatDateTimeIsoJP(order.createdAt),
        formatDateTimeIsoJP(order.updatedAt),
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
}: ExportOrderHistoryCsvParams): Promise<
  Result<ExportOrderHistoryCsvResult, "エラーが発生しました。">
> => {
  const ordersResult = await fetchAllOrders(dbClient)
  if (!ordersResult.ok) return { ok: false, message: "エラーが発生しました。" }
  const orders = ordersResult.value
  const rows = buildOrderRows(orders)
  const csvRows =
    rows.length > 0 ? [ORDER_HISTORY_HEADER, ...rows] : [ORDER_HISTORY_HEADER]
  const csv = toCsv(csvRows)
  return {
    ok: true,
    value: {
      csv,
      exportedAt: new Date(),
      orderCount: orders.length,
      rowCount: rows.length,
    },
  }
}
