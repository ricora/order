import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test"
import type Order from "../../domain/order/entities/order"
import type { DbClient } from "../../libs/db/client"

const mockOrder: Order = {
  id: 2,
  customerName: "Hanako",
  comment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "processing",
  orderItems: [
    { productId: 2, productName: "P2", unitAmount: 300, quantity: 1 },
  ],
  totalAmount: 300,
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

const { getOrderEditPageData } = await import("./getOrderEditPageData")

const dbClient = {} as DbClient

describe("getOrderEditPageData", () => {
  beforeAll(() => {
    orderRepository.findOrderById.mockClear()
    orderRepository.findOrderById.mockImplementation(async () => mockOrder)
  })

  afterAll(() => {
    mock.restore()
  })

  it("注文編集ページ用のデータを取得できる", async () => {
    const result = await getOrderEditPageData({ dbClient, order: { id: 2 } })
    expect(result.order).not.toBeNull()
    expect(result.order?.id).toBe(2)
    expect(result.order?.status).toBe("processing")
  })

  it("注文が見つからない場合はnullを返す", async () => {
    orderRepository.findOrderById.mockImplementationOnce(async () => null)
    const result = await getOrderEditPageData({ dbClient, order: { id: 999 } })
    expect(result.order).toBeNull()
  })
})
