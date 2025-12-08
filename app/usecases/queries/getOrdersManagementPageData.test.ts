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

const mockOrders: Order[] = [
  {
    id: 1,
    customerName: "田中太郎",
    comment: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    status: "pending",
    orderItems: [
      { productId: 1, productName: "商品A", unitAmount: 1000, quantity: 2 },
    ],
    totalAmount: 2000,
  },
  {
    id: 2,
    customerName: "鈴木花子",
    comment: null,
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
    status: "completed",
    orderItems: [
      { productId: 2, productName: "商品B", unitAmount: 500, quantity: 3 },
    ],
    totalAmount: 1500,
  },
  {
    id: 3,
    customerName: null,
    comment: null,
    createdAt: new Date("2025-01-03"),
    updatedAt: new Date("2025-01-03"),
    status: "pending",
    orderItems: [
      { productId: 3, productName: "商品C", unitAmount: 2000, quantity: 1 },
    ],
    totalAmount: 2000,
  },
]

type OrderRepository = typeof import("../repositories-provider").orderRepository
type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock<OrderRepository[K]>
}
const orderRepository = {
  findAllOrdersOrderByIdAsc: mock<OrderRepository["findAllOrdersOrderByIdAsc"]>(
    async () => ({ ok: true as const, value: mockOrders }),
  ),
  findAllOrdersOrderByIdDesc: mock<
    OrderRepository["findAllOrdersOrderByIdDesc"]
  >(async () => ({ ok: true as const, value: mockOrders })),
} satisfies Partial<MockOrderRepository>

const productRepository = {} satisfies Partial<
  typeof import("../repositories-provider").productRepository
>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { getOrdersManagementPageData } = await import(
  "./getOrdersManagementPageData"
)

const dbClient = {} as DbClient

describe("getOrdersManagementPageData", () => {
  beforeAll(() => {
    orderRepository.findAllOrdersOrderByIdAsc.mockImplementation(async () => ({
      ok: true as const,
      value: mockOrders,
    }))
    orderRepository.findAllOrdersOrderByIdDesc.mockImplementation(async () => ({
      ok: true as const,
      value: mockOrders,
    }))
  })
  afterAll(() => {
    mock.restore()
  })

  it("注文一覧をデフォルト（昇順）で取得できる", async () => {
    const result = await getOrdersManagementPageData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.orders.length).toBe(3)
    expect(result.value.orders[0]?.id).toBe(1)
    expect(result.value.orders[1]?.customerName).toBe("鈴木花子")
    expect(result.value.orders[2]?.status).toBe("pending")
    expect(result.value.hasNextPage).toBe(false)
    expect(result.value.currentPage).toBe(1)
    expect(result.value.pageSize).toBe(50)
  })

  it("sort='asc'で昇順を指定できる", async () => {
    const result = await getOrdersManagementPageData({ dbClient, sort: "asc" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.orders.length).toBe(3)
    expect(result.value.orders[0]?.id).toBe(1)
  })

  it("sort='desc'で降順を指定できる", async () => {
    const result = await getOrdersManagementPageData({ dbClient, sort: "desc" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.orders.length).toBe(3)
  })

  it("pageSize+1を取得して次ページの有無を判定できる", async () => {
    const manyOrders: Order[] = Array.from({ length: 51 }, (_, i) => ({
      id: i + 1,
      customerName: `顧客${i + 1}`,
      comment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
      orderItems: [
        { productId: 1, productName: "商品", unitAmount: 1000, quantity: 1 },
      ],
      totalAmount: 1000,
    }))

    orderRepository.findAllOrdersOrderByIdAsc.mockImplementationOnce(
      async () => ({ ok: true as const, value: manyOrders }),
    )

    const result = await getOrdersManagementPageData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.orders.length).toBe(50)
    expect(result.value.hasNextPage).toBe(true)
    expect(result.value.currentPage).toBe(1)
  })

  it("ページネーション: page=2の場合、currentPageが正しい", async () => {
    const manyOrders: Order[] = Array.from({ length: 51 }, (_, i) => ({
      id: i + 1,
      customerName: `顧客${i + 1}`,
      comment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
      orderItems: [
        { productId: 1, productName: "商品", unitAmount: 1000, quantity: 1 },
      ],
      totalAmount: 1000,
    }))

    orderRepository.findAllOrdersOrderByIdAsc.mockImplementationOnce(
      async () => ({ ok: true as const, value: manyOrders }),
    )

    const result = await getOrdersManagementPageData({ dbClient, page: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.currentPage).toBe(2)
    expect(result.value.pageSize).toBe(50)
  })

  it("customerNameがnullの場合も正しく処理できる", async () => {
    const result = await getOrdersManagementPageData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const thirdOrder = result.value.orders[2]
    if (!thirdOrder) throw new Error("no orders returned")
    expect(thirdOrder.customerName).toBeNull()
    expect(thirdOrder.totalAmount).toBe(2000)
  })

  it("findAllOrdersOrderByIdAscがドメインエラーを返す場合は汎用エラーを返す", async () => {
    orderRepository.findAllOrdersOrderByIdAsc.mockImplementationOnce(
      async () => {
        return { ok: false as const, message: "エラーが発生しました。" }
      },
    )
    const res = await getOrdersManagementPageData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findAllOrdersOrderByIdAscが例外を投げる場合は汎用エラーを返す", async () => {
    orderRepository.findAllOrdersOrderByIdAsc.mockImplementationOnce(
      async () => {
        throw new Error("unexpected")
      },
    )
    const res = await getOrdersManagementPageData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })
})
