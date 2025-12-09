import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test"
import type { Order } from "../../domain/order/entities"
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

const { getOrderEditPageData } = await import("./getOrderEditPageData")

const dbClient = {} as DbClient

describe("getOrderEditPageData", () => {
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

  it("注文編集ページ用のデータを取得できる", async () => {
    const result = await getOrderEditPageData({ dbClient, order: { id: 2 } })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.order).not.toBeNull()
    expect(result.value.order?.id).toBe(2)
    expect(result.value.order?.status).toBe("processing")
  })

  it("注文が見つからない場合はエラーを返す", async () => {
    orderRepository.findOrderById.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "注文が見つかりません。",
    }))
    const result = await getOrderEditPageData({ dbClient, order: { id: 999 } })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("注文が見つかりません。")
  })

  it("リポジトリが例外を投げる場合は汎用エラーを返す", async () => {
    orderRepository.findOrderById.mockImplementationOnce(async () => {
      throw new Error("unexpected")
    })
    const res = await getOrderEditPageData({ dbClient, order: { id: 999 } })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })
})
