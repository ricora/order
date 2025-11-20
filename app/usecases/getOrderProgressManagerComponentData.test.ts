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
import { getOrderProgressManagerComponentData } from "./getOrderProgressManagerComponentData"

const dbClient = {} as DbClient

const now = new Date()
const oneHourAgo = new Date(now.getTime() - 3600000)

const activeOrders: Order[] = [
  {
    id: 1,
    customerName: "Taro",
    comment: null,
    createdAt: oneHourAgo,
    updatedAt: oneHourAgo,
    status: "pending",
    orderItems: [
      { productId: 1, productName: "A", unitAmount: 100, quantity: 1 },
    ],
    totalAmount: 100,
  },
  {
    id: 2,
    customerName: "Hanako",
    comment: null,
    createdAt: new Date(now.getTime() - 1800000),
    updatedAt: new Date(now.getTime() - 1800000),
    status: "processing",
    orderItems: [
      { productId: 2, productName: "B", unitAmount: 200, quantity: 1 },
    ],
    totalAmount: 200,
  },
]

const inactiveOrders: Order[] = [
  {
    id: 3,
    customerName: "Jiro",
    comment: null,
    createdAt: new Date(now.getTime() - 7200000),
    updatedAt: now,
    status: "completed",
    orderItems: [
      { productId: 3, productName: "C", unitAmount: 300, quantity: 1 },
    ],
    totalAmount: 300,
  },
  {
    id: 4,
    customerName: null,
    comment: null,
    createdAt: new Date(now.getTime() - 10800000),
    updatedAt: now,
    status: "cancelled",
    orderItems: [
      { productId: 4, productName: "D", unitAmount: 400, quantity: 1 },
    ],
    totalAmount: 400,
  },
]

describe("getOrderProgressManagerComponentData", () => {
  beforeAll(() => {
    spyOn(
      orderQueryRepository,
      "findAllOrdersByActiveStatusOrderByUpdatedAtAsc",
    ).mockImplementation(async () => activeOrders)

    spyOn(
      orderQueryRepository,
      "findAllOrdersByInactiveStatusOrderByUpdatedAtDesc",
    ).mockImplementation(async () => inactiveOrders)
  })

  afterAll(() => {
    mock.restore()
  })

  it("ステータス別に注文を正しく分類できる", async () => {
    const result = await getOrderProgressManagerComponentData({ dbClient })

    expect(result.pendingOrders.length).toBe(1)
    expect(result.pendingOrders[0]?.id).toBe(1)
    expect(result.pendingOrders[0]?.status).toBe("pending")

    expect(result.processingOrders.length).toBe(1)
    expect(result.processingOrders[0]?.id).toBe(2)
    expect(result.processingOrders[0]?.status).toBe("processing")

    expect(result.completedOrders.length).toBe(1)
    expect(result.completedOrders[0]?.id).toBe(3)
    expect(result.completedOrders[0]?.status).toBe("completed")

    expect(result.cancelledOrders.length).toBe(1)
    expect(result.cancelledOrders[0]?.id).toBe(4)
    expect(result.cancelledOrders[0]?.status).toBe("cancelled")
  })

  it("アクティブな注文を取得時にpaginationを使用する", async () => {
    const spy = spyOn(
      orderQueryRepository,
      "findAllOrdersByActiveStatusOrderByUpdatedAtAsc",
    )

    await getOrderProgressManagerComponentData({ dbClient })

    expect(spy).toHaveBeenCalledWith({
      dbClient,
      pagination: { offset: 0, limit: 100 },
    })
  })

  it("非アクティブな注文を取得時にpaginationを使用する", async () => {
    const spy = spyOn(
      orderQueryRepository,
      "findAllOrdersByInactiveStatusOrderByUpdatedAtDesc",
    )

    await getOrderProgressManagerComponentData({ dbClient })

    expect(spy).toHaveBeenCalledWith({
      dbClient,
      pagination: { offset: 0, limit: 50 },
    })
  })
})
