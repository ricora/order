import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test"
import type Order from "../../domain/order/entities/order"
import type { DbClient } from "../../libs/db/client"

const mockOrder: Order = {
  id: 1,
  customerName: "Taro",
  comment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "pending",
  orderItems: [
    { productId: 1, productName: "P1", unitAmount: 100, quantity: 2 },
  ],
  totalAmount: 200,
}

const orderRepository = {
  findOrderById: mock(async (): Promise<Order | null> => mockOrder),
} satisfies Partial<typeof import("../repositories-provider").orderRepository>

const productRepository = {} satisfies Partial<
  typeof import("../repositories-provider").productRepository
>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { getOrderDeletePageData } = await import("./getOrderDeletePageData")

const dbClient = {} as DbClient

describe("getOrderDeletePageData", () => {
  beforeAll(() => {
    orderRepository.findOrderById.mockClear()
    orderRepository.findOrderById.mockImplementation(async () => mockOrder)
  })

  afterAll(() => {
    mock.restore()
  })

  it("注文削除ページ用のデータを取得できる", async () => {
    const result = await getOrderDeletePageData({ dbClient, order: { id: 1 } })
    expect(result.order).not.toBeNull()
    expect(result.order?.id).toBe(1)
    expect(result.order?.totalAmount).toBe(200)
  })

  it("注文が見つからない場合はnullを返す", async () => {
    orderRepository.findOrderById.mockImplementationOnce(async () => null)
    const result = await getOrderDeletePageData({
      dbClient,
      order: { id: 999 },
    })
    expect(result.order).toBeNull()
  })
})
