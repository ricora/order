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
import { getOrderProgressPageData } from "./getOrderProgressPageData"

const dbClient = {} as DbClient

const sampleOrders: Order[] = [
  {
    id: 1,
    customerName: "Taro",
    createdAt: new Date(),
    status: "pending",
    orderItems: [
      { productId: 1, productName: "A", unitAmount: 100, quantity: 1 },
    ],
    totalAmount: 100,
  },
  {
    id: 2,
    customerName: null,
    createdAt: new Date(),
    status: "completed",
    orderItems: [
      { productId: 2, productName: "B", unitAmount: 200, quantity: 2 },
    ],
    totalAmount: 400,
  },
]

describe("getOrderProgressPageData", () => {
  beforeAll(() => {
    spyOn(orderQueryRepository, "findAllOrders").mockImplementation(
      async () => sampleOrders,
    )
  })

  afterAll(() => {
    mock.restore()
  })

  it("注文を正しく取得できる", async () => {
    const result = await getOrderProgressPageData({ dbClient })
    expect(result.orders.length).toBe(2)
    const [first, second] = result.orders
    if (!first || !second) throw new Error("unexpected empty orders")
    expect(first.id).toBe(1)
    expect(second.status).toBe("completed")
    expect(second.totalAmount).toBe(400)
  })
})
