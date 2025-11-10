import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type Order from "../domain/order/entities/order"
import * as orderQueryRepository from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { getOrdersManagementPageData } from "./getOrdersManagementPageData"

const mockOrders: Order[] = [
  {
    id: 1,
    customerName: "田中太郎",
    createdAt: new Date("2025-01-01"),
    status: "pending",
    orderItems: [
      { productId: 1, productName: "商品A", unitAmount: 1000, quantity: 2 },
    ],
    totalAmount: 2000,
  },
  {
    id: 2,
    customerName: "鈴木花子",
    createdAt: new Date("2025-01-02"),
    status: "completed",
    orderItems: [
      { productId: 2, productName: "商品B", unitAmount: 500, quantity: 3 },
    ],
    totalAmount: 1500,
  },
  {
    id: 3,
    customerName: null,
    createdAt: new Date("2025-01-03"),
    status: "pending",
    orderItems: [
      { productId: 3, productName: "商品C", unitAmount: 2000, quantity: 1 },
    ],
    totalAmount: 2000,
  },
]

const dbClient = {} as DbClient

describe("getOrdersManagementPageData", () => {
  beforeAll(() => {
    spyOn(orderQueryRepository, "findAllOrders").mockImplementation(
      async () => mockOrders,
    )
  })
  afterAll(() => {
    mock.restore()
  })

  it("注文一覧を正しく取得できる", async () => {
    const result = await getOrdersManagementPageData({ dbClient })
    expect(result.orders.length).toBe(3)
    expect(result.orders[0]?.id).toBe(1)
    expect(result.orders[1]?.customerName).toBe("鈴木花子")
    expect(result.orders[2]?.status).toBe("pending")
    expect(result.hasNextPage).toBe(false)
    expect(result.currentPage).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it("pageSize+1を取得して次ページの有無を判定できる", async () => {
    const manyOrders: Order[] = Array.from({ length: 21 }, (_, i) => ({
      id: i + 1,
      customerName: `顧客${i + 1}`,
      createdAt: new Date(),
      status: "pending",
      orderItems: [
        { productId: 1, productName: "商品", unitAmount: 1000, quantity: 1 },
      ],
      totalAmount: 1000,
    }))

    spyOn(orderQueryRepository, "findAllOrders").mockImplementationOnce(
      async () => manyOrders,
    )

    const result = await getOrdersManagementPageData({ dbClient })
    expect(result.orders.length).toBe(20)
    expect(result.hasNextPage).toBe(true)
    expect(result.currentPage).toBe(1)
  })

  it("ページネーション: page=2の場合、currentPageが正しい", async () => {
    const manyOrders: Order[] = Array.from({ length: 21 }, (_, i) => ({
      id: i + 1,
      customerName: `顧客${i + 1}`,
      createdAt: new Date(),
      status: "pending",
      orderItems: [
        { productId: 1, productName: "商品", unitAmount: 1000, quantity: 1 },
      ],
      totalAmount: 1000,
    }))

    spyOn(orderQueryRepository, "findAllOrders").mockImplementationOnce(
      async () => manyOrders,
    )

    const result = await getOrdersManagementPageData({ dbClient, page: 2 })
    expect(result.currentPage).toBe(2)
    expect(result.pageSize).toBe(20)
  })

  it("customerNameがnullの場合も正しく処理できる", async () => {
    const result = await getOrdersManagementPageData({ dbClient })
    const thirdOrder = result.orders[2]
    if (!thirdOrder) throw new Error("no orders returned")
    expect(thirdOrder.customerName).toBeNull()
    expect(thirdOrder.totalAmount).toBe(2000)
  })
})
