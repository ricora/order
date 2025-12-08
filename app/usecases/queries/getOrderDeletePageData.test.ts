import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test"
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

type OrderRepository = typeof import("../repositories-provider").orderRepository
type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock<OrderRepository[K]>
}
const orderRepository = {
  findOrderById: mock<OrderRepository["findOrderById"]>(async () => ({
    ok: true as const,
    value: mockOrder,
  })),
} satisfies Partial<MockOrderRepository>

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
    orderRepository.findOrderById.mockImplementation(async () => ({
      ok: true as const,
      value: mockOrder,
    }))
  })

  afterAll(() => {
    mock.restore()
  })

  it("注文削除ページ用のデータを取得できる", async () => {
    const result = await getOrderDeletePageData({ dbClient, order: { id: 1 } })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.order).not.toBeNull()
    expect(result.value.order?.id).toBe(1)
    expect(result.value.order?.totalAmount).toBe(200)
  })

  it("注文が見つからない場合はエラーを返す", async () => {
    orderRepository.findOrderById.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "注文が見つかりません。",
    }))
    const result = await getOrderDeletePageData({
      dbClient,
      order: { id: 999 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("注文が見つかりません。")
  })

  it("リポジトリが例外を投げる場合は汎用エラーを返す", async () => {
    orderRepository.findOrderById.mockImplementationOnce(async () => {
      throw new Error("unexpected")
    })
    const result = await getOrderDeletePageData({ dbClient, order: { id: 1 } })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("エラーが発生しました。")
  })
})
