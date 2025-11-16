import type Order from "../domain/order/entities/order"
import { findAllOrders } from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { toCsv } from "../utils/csv"

export const ORDER_HISTORY_EXPORT_PAGE_SIZE = 200

export const ORDER_HISTORY_COLUMNS = [
  {
    name: "order_id",
    description: "注文ID（一意の識別子）",
  },
  {
    name: "order_created_at",
    description: "注文の作成日時（ISO 8601形式）",
  },
  {
    name: "order_updated_at",
    description: "注文の更新日時（ISO 8601形式）",
  },
  {
    name: "order_status",
    description: (
      <>
        注文のステータス（<code>pending</code> / <code>confirmed</code> /{" "}
        <code>completed</code>）
      </>
    ),
  },
  {
    name: "customer_name",
    description: "注文の顧客名",
  },
  {
    name: "order_total_amount",
    description: "注文全体の合計金額（円）",
  },
  {
    name: "order_item_count",
    description: "注文に含まれる注文明細の総数",
  },
  {
    name: "line_index",
    description: "注文明細の行番号（1から始まる連番）",
  },
  {
    name: "product_id",
    description: "注文明細の商品ID",
  },
  {
    name: "product_name",
    description: "注文明細の商品名",
  },
  {
    name: "unit_amount",
    description: "注文明細の単価（円）",
  },
  {
    name: "quantity",
    description: "注文明細の数量",
  },
  {
    name: "line_total_amount",
    description: "注文明細の合計金額（単価×数量、円）",
  },
] as const

export const ORDER_HISTORY_HEADER = ORDER_HISTORY_COLUMNS.map((col) => col.name)

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
  const pageSize = ORDER_HISTORY_EXPORT_PAGE_SIZE
  const limit = pageSize + 1

  // fetch in deterministic order by primary key via existing repository
  while (true) {
    const chunk = await findAllOrders({
      dbClient,
      pagination: {
        offset: orders.length,
        limit,
      },
    })
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
