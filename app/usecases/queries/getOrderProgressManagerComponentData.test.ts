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

type OrderRepository = typeof import("../repositories-provider").orderRepository
type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock<OrderRepository[K]>
}
const orderRepository = {
  findAllOrdersByActiveStatusOrderByUpdatedAtAsc: mock<
    OrderRepository["findAllOrdersByActiveStatusOrderByUpdatedAtAsc"]
  >(async () => ({ ok: true as const, value: activeOrders })),
  findAllOrdersByInactiveStatusOrderByUpdatedAtDesc: mock<
    OrderRepository["findAllOrdersByInactiveStatusOrderByUpdatedAtDesc"]
  >(async () => ({ ok: true as const, value: inactiveOrders })),
} satisfies Partial<MockOrderRepository>

const productRepository = {} satisfies Partial<
  typeof import("../repositories-provider").productRepository
>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { getOrderProgressManagerComponentData } = await import(
  "./getOrderProgressManagerComponentData"
)

describe("getOrderProgressManagerComponentData", () => {
  beforeAll(() => {
    orderRepository.findAllOrdersByActiveStatusOrderByUpdatedAtAsc.mockClear()
    orderRepository.findAllOrdersByInactiveStatusOrderByUpdatedAtDesc.mockClear()
    orderRepository.findAllOrdersByActiveStatusOrderByUpdatedAtAsc.mockImplementation(
      async () => ({ ok: true as const, value: activeOrders }),
    )
    orderRepository.findAllOrdersByInactiveStatusOrderByUpdatedAtDesc.mockImplementation(
      async () => ({ ok: true as const, value: inactiveOrders }),
    )
  })

  afterAll(() => {
    mock.restore()
  })

  it("ステータス別に注文を正しく分類できる", async () => {
    const result = await getOrderProgressManagerComponentData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.pendingOrders.length).toBe(1)
    expect(result.value.pendingOrders[0]?.id).toBe(1)
    expect(result.value.pendingOrders[0]?.status).toBe("pending")

    expect(result.value.processingOrders.length).toBe(1)
    expect(result.value.processingOrders[0]?.id).toBe(2)
    expect(result.value.processingOrders[0]?.status).toBe("processing")

    expect(result.value.completedOrders.length).toBe(1)
    expect(result.value.completedOrders[0]?.id).toBe(3)
    expect(result.value.completedOrders[0]?.status).toBe("completed")

    expect(result.value.cancelledOrders.length).toBe(1)
    expect(result.value.cancelledOrders[0]?.id).toBe(4)
    expect(result.value.cancelledOrders[0]?.status).toBe("cancelled")
  })

  it("アクティブな注文を取得時にpaginationを使用する", async () => {
    await getOrderProgressManagerComponentData({ dbClient })

    expect(
      orderRepository.findAllOrdersByActiveStatusOrderByUpdatedAtAsc,
    ).toHaveBeenCalledWith({
      dbClient,
      pagination: { offset: 0, limit: 100 },
    })
  })

  it("非アクティブな注文を取得時にpaginationを使用する", async () => {
    await getOrderProgressManagerComponentData({ dbClient })

    expect(
      orderRepository.findAllOrdersByInactiveStatusOrderByUpdatedAtDesc,
    ).toHaveBeenCalledWith({
      dbClient,
      pagination: { offset: 0, limit: 50 },
    })
  })

  it("findAllOrdersByActiveStatusOrderByUpdatedAtAscがドメインエラーを返す場合は汎用エラーを返す", async () => {
    orderRepository.findAllOrdersByActiveStatusOrderByUpdatedAtAsc.mockImplementationOnce(
      async () => {
        return { ok: false as const, message: "エラーが発生しました。" }
      },
    )
    const res = await getOrderProgressManagerComponentData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findAllOrdersByActiveStatusOrderByUpdatedAtAscが例外を投げる場合は汎用エラーを返す", async () => {
    orderRepository.findAllOrdersByActiveStatusOrderByUpdatedAtAsc.mockImplementationOnce(
      async () => {
        throw new Error("unexpected error")
      },
    )
    const res = await getOrderProgressManagerComponentData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findAllOrdersByInactiveStatusOrderByUpdatedAtDescがドメインエラーを返す場合は汎用エラーを返す", async () => {
    orderRepository.findAllOrdersByActiveStatusOrderByUpdatedAtAsc.mockImplementationOnce(
      async () => ({ ok: true as const, value: activeOrders }),
    )

    orderRepository.findAllOrdersByInactiveStatusOrderByUpdatedAtDesc.mockImplementationOnce(
      async () => {
        return { ok: false as const, message: "エラーが発生しました。" }
      },
    )
    const res = await getOrderProgressManagerComponentData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findAllOrdersByInactiveStatusOrderByUpdatedAtDescが例外を投げる場合は汎用エラーを返す", async () => {
    orderRepository.findAllOrdersByActiveStatusOrderByUpdatedAtAsc.mockImplementationOnce(
      async () => ({ ok: true as const, value: activeOrders }),
    )

    orderRepository.findAllOrdersByInactiveStatusOrderByUpdatedAtDesc.mockImplementationOnce(
      async () => {
        throw new Error("unexpected error")
      },
    )
    const res = await getOrderProgressManagerComponentData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })
})
