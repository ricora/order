import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import type Order from "../domain/order/entities/order"
import * as orderQueryRepository from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import {
  exportOrderHistoryCsv,
  ORDER_HISTORY_EXPORT_PAGE_SIZE,
} from "./exportOrderHistoryCsv"

const dbClient = {} as DbClient

const mockOrder = (id: number, overrides?: Partial<Order>): Order => ({
  id,
  customerName: `Customer ${id}`,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T01:00:00.000Z"),
  status: "completed",
  totalAmount: 1000,
  orderItems: [
    {
      productId: 1,
      productName: "Sample",
      unitAmount: 1000,
      quantity: 1,
    },
  ],
  ...overrides,
})

describe("exportOrderHistoryCsv", () => {
  afterEach(() => {
    mock.restore()
  })

  it("注文を行アイテム付きでCSV行に変換する", async () => {
    const orders: Order[] = [
      {
        id: 1,
        customerName: "Alice",
        createdAt: new Date("2024-01-01T09:00:00.000Z"),
        updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        status: "completed",
        totalAmount: 1500,
        orderItems: [
          {
            productId: 10,
            productName: "Coffee",
            unitAmount: 500,
            quantity: 2,
          },
          {
            productId: null,
            productName: "Cookie",
            unitAmount: 500,
            quantity: 1,
          },
        ],
      },
      {
        id: 2,
        customerName: null,
        createdAt: new Date("2024-01-02T09:00:00.000Z"),
        updatedAt: new Date("2024-01-02T09:30:00.000Z"),
        status: "pending",
        totalAmount: 1000,
        orderItems: [
          {
            productId: 20,
            productName: "Tea",
            unitAmount: 1000,
            quantity: 1,
          },
        ],
      },
    ]

    spyOn(orderQueryRepository, "findAllOrders").mockImplementation(
      async ({ pagination }) => {
        if (pagination.offset === 0) {
          return orders
        }
        return []
      },
    )

    const result = await exportOrderHistoryCsv({ dbClient })
    expect(result.orderCount).toBe(2)
    expect(result.rowCount).toBe(3)
    expect(result.exportedAt).toBeInstanceOf(Date)

    expect(result.csv).toBe(
      `${[
        "order_id,order_created_at,order_updated_at,order_status,customer_name,order_total_amount,order_item_count,line_index,product_id,product_name,unit_amount,quantity,line_total_amount",
        "1,2024-01-01T09:00:00.000Z,2024-01-01T10:00:00.000Z,completed,Alice,1500,2,1,10,Coffee,500,2,1000",
        "1,2024-01-01T09:00:00.000Z,2024-01-01T10:00:00.000Z,completed,Alice,1500,2,2,,Cookie,500,1,500",
        "2,2024-01-02T09:00:00.000Z,2024-01-02T09:30:00.000Z,pending,,1000,1,1,20,Tea,1000,1,1000",
      ].join("\n")}\n`,
    )
  })

  it("ページをまたいで全注文を取得する", async () => {
    const firstPage = Array.from(
      { length: ORDER_HISTORY_EXPORT_PAGE_SIZE + 1 },
      (_, i) => mockOrder(i + 1),
    )
    const secondPage = [mockOrder(ORDER_HISTORY_EXPORT_PAGE_SIZE + 1)]

    const findAllSpy = spyOn(
      orderQueryRepository,
      "findAllOrders",
    ).mockImplementation(async ({ pagination }) => {
      if (pagination.offset === 0) {
        expect(pagination.limit).toBe(ORDER_HISTORY_EXPORT_PAGE_SIZE + 1)
        return firstPage
      }
      if (pagination.offset === ORDER_HISTORY_EXPORT_PAGE_SIZE) {
        expect(pagination.limit).toBe(ORDER_HISTORY_EXPORT_PAGE_SIZE + 1)
        return secondPage
      }
      return []
    })

    const result = await exportOrderHistoryCsv({ dbClient })

    expect(findAllSpy).toHaveBeenCalledTimes(2)
    expect(result.orderCount).toBe(
      ORDER_HISTORY_EXPORT_PAGE_SIZE + secondPage.length,
    )
    expect(result.rowCount).toBe(
      ORDER_HISTORY_EXPORT_PAGE_SIZE + secondPage.length,
    )
  })

  it("行アイテムがない注文はプレースホルダー行を出力する", async () => {
    const emptyOrder = mockOrder(99, {
      orderItems: [],
      totalAmount: 0,
    })

    spyOn(orderQueryRepository, "findAllOrders").mockImplementation(
      async () => [emptyOrder],
    )

    const result = await exportOrderHistoryCsv({ dbClient })
    expect(result.rowCount).toBe(1)
    const [, row] = result.csv.split("\n")
    if (!row) throw new Error("expected one data row")
    const columns = row.split(",")
    expect(columns[6]).toBe("0") // order_item_count
    expect(columns[7]).toBe("0") // line_index
    expect(columns[8]).toBe("") // product_id
    expect(columns[9]).toBe("") // product_name
    expect(columns[10]).toBe("") // unit_amount
    expect(columns[11]).toBe("0") // quantity
    expect(columns[12]).toBe("0") // line_total_amount
  })
})
