import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test"
import type { TransactionDbClient } from "../../libs/db/client"
import type Order from "./entities/order"
import { createRepositories, type Repositories } from "./repositories"

type MockRepositories = {
  [K in keyof Repositories]: Mock<Repositories[K]>
}

const baseOrder: Omit<Order, "id"> = {
  customerName: "Taro",
  comment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "pending",
  totalAmount: 300,
  orderItems: [
    { productId: 1, productName: "A", unitAmount: 100, quantity: 2 },
    { productId: 2, productName: "B", unitAmount: 100, quantity: 1 },
  ],
}

describe("Order repositories", () => {
  const mockDbClient = {} as TransactionDbClient
  let adapters: MockRepositories
  let repositories: Repositories

  beforeEach(() => {
    adapters = {
      findOrderById: mock(async () => null),
      findAllOrdersOrderByIdAsc: mock(async () => []),
      findAllOrdersOrderByIdDesc: mock(async () => []),
      findAllOrdersByActiveStatusOrderByUpdatedAtAsc: mock(async () => []),
      findAllOrdersByInactiveStatusOrderByUpdatedAtDesc: mock(async () => []),
      createOrder: mock(async ({ order }) => ({ ...order, id: 42 })),
      updateOrder: mock(async () => null),
      deleteOrder: mock(async () => {}),
    }
    repositories = createRepositories(adapters)
  })

  afterEach(() => {
    mock.restore()
  })

  describe("createOrder", () => {
    it("バリデーションを通過した注文を作成できる", async () => {
      const result = await repositories.createOrder({
        order: baseOrder,
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.id).toBe(42)
      expect(result?.totalAmount).toBe(300)
      expect(adapters.createOrder).toHaveBeenCalledTimes(1)
    })

    it("合計金額が一致しない場合はエラーを投げる", async () => {
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, totalAmount: 999 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("合計金額が正しくありません")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("顧客名が長すぎる場合はエラーを投げる", async () => {
      const longName = "あ".repeat(51)
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, customerName: longName },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("顧客名は50文字以内である必要があります")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("注文項目が0件の場合はエラーを投げる", async () => {
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, orderItems: [], totalAmount: 0 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("注文項目は1種類以上20種類以下である必要があります")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("注文項目の数量が0の場合はエラーを投げる", async () => {
      const badItems = [
        { productId: 1, productName: "A", unitAmount: 100, quantity: 0 },
      ]
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, orderItems: badItems, totalAmount: 0 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("注文項目の数量は1以上である必要があります")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("商品名が長すぎる場合はエラーを投げる", async () => {
      const longProductName = "a".repeat(501)
      const badItems = [
        {
          productId: 1,
          productName: longProductName,
          unitAmount: 100,
          quantity: 1,
        },
      ]
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, orderItems: badItems, totalAmount: 100 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("商品名は1文字以上500文字以内である必要があります")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("商品名が空の場合はエラーを投げる", async () => {
      const badItems = [
        { productId: 1, productName: "", unitAmount: 100, quantity: 1 },
      ]
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, orderItems: badItems, totalAmount: 100 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("商品名は1文字以上500文字以内である必要があります")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("単価が負の場合はエラーを投げる", async () => {
      const badItems = [
        { productId: 1, productName: "A", unitAmount: -10, quantity: 1 },
      ]
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, orderItems: badItems, totalAmount: -10 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("注文項目の単価は0以上である必要があります")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("注文項目が21種類ある場合はエラーを投げる", async () => {
      const manyItems = Array.from({ length: 21 }, (_, i) => ({
        productId: i + 1,
        productName: String(i + 1),
        unitAmount: 1,
        quantity: 1,
      }))
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, orderItems: manyItems, totalAmount: 21 },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("注文項目は1種類以上20種類以下である必要があります")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("顧客名がnullの場合は作成できる", async () => {
      adapters.createOrder.mockImplementation(async ({ order }) => ({
        ...order,
        id: 99,
      }))

      const result = await repositories.createOrder({
        order: { ...baseOrder, customerName: null },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.id).toBe(99)
    })

    it("コメントが長すぎる場合はエラーを投げる", async () => {
      const longComment = "あ".repeat(251)
      await expect(
        repositories.createOrder({
          order: { ...baseOrder, comment: longComment },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("コメントは250文字以内である必要があります")
      expect(adapters.createOrder).not.toHaveBeenCalled()
    })

    it("コメントがnullの場合は作成できる", async () => {
      adapters.createOrder.mockImplementation(async ({ order }) => ({
        ...order,
        id: 100,
      }))

      const result = await repositories.createOrder({
        order: { ...baseOrder, comment: null },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.id).toBe(100)
    })

    it("コメントが250文字の場合は作成できる", async () => {
      const comment250 = "あ".repeat(250)
      adapters.createOrder.mockImplementation(async ({ order }) => ({
        ...order,
        id: 101,
      }))

      const result = await repositories.createOrder({
        order: { ...baseOrder, comment: comment250 },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.id).toBe(101)
    })
  })

  describe("updateOrder", () => {
    it("バリデーションを通過した注文を更新できる", async () => {
      adapters.updateOrder.mockImplementation(async ({ order }) => ({
        id: order.id,
        customerName: order.customerName ?? null,
        comment: order.comment ?? null,
        createdAt: new Date(),
        updatedAt: order.updatedAt,
        status: order.status ?? "pending",
        orderItems: baseOrder.orderItems,
        totalAmount: baseOrder.totalAmount,
      }))

      const result = await repositories.updateOrder({
        order: { id: 42, customerName: "Jiro", updatedAt: new Date() },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.id).toBe(42)
      expect(result?.customerName).toBe("Jiro")
      expect(adapters.updateOrder).toHaveBeenCalledTimes(1)
    })

    it("顧客名が長すぎる場合はエラーを投げる", async () => {
      const longName = "あ".repeat(51)
      await expect(
        repositories.updateOrder({
          order: { id: 1, customerName: longName, updatedAt: new Date() },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("顧客名は50文字以内である必要があります")
      expect(adapters.updateOrder).not.toHaveBeenCalled()
    })

    it("不正な状態の場合はエラーを投げる", async () => {
      await expect(
        repositories.updateOrder({
          // @ts-expect-error invalid status
          order: { id: 1, status: "todo", updatedAt: new Date() },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow(
        "注文の状態は'pending', 'processing', 'completed', 'cancelled'のいずれかである必要があります",
      )
      expect(adapters.updateOrder).not.toHaveBeenCalled()
    })

    it("注文の状態を更新できる", async () => {
      adapters.updateOrder.mockImplementation(async ({ order }) => ({
        id: order.id,
        customerName: "X",
        comment: order.comment ?? null,
        createdAt: new Date(),
        updatedAt: order.updatedAt,
        status: order.status ?? "pending",
        orderItems: baseOrder.orderItems,
        totalAmount: baseOrder.totalAmount,
      }))

      const result = await repositories.updateOrder({
        order: { id: 7, status: "processing", updatedAt: new Date() },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.status).toBe("processing")
    })

    it("コメントが長すぎる場合はエラーを投げる", async () => {
      const longComment = "あ".repeat(251)
      await expect(
        repositories.updateOrder({
          order: { id: 1, comment: longComment, updatedAt: new Date() },
          dbClient: mockDbClient,
        }),
      ).rejects.toThrow("コメントは250文字以内である必要があります")
      expect(adapters.updateOrder).not.toHaveBeenCalled()
    })

    it("コメントを更新できる", async () => {
      const testComment = "これはコメントです"
      adapters.updateOrder.mockImplementation(async ({ order }) => ({
        id: order.id,
        customerName: "X",
        comment: order.comment ?? null,
        createdAt: new Date(),
        updatedAt: order.updatedAt,
        status: order.status ?? "pending",
        orderItems: baseOrder.orderItems,
        totalAmount: baseOrder.totalAmount,
      }))

      const result = await repositories.updateOrder({
        order: { id: 8, comment: testComment, updatedAt: new Date() },
        dbClient: mockDbClient,
      })
      expect(result).not.toBeNull()
      expect(result?.comment).toBe(testComment)
    })
  })

  describe("deleteOrder", () => {
    it("注文を削除できる", async () => {
      await repositories.deleteOrder({
        order: { id: 1 },
        dbClient: mockDbClient,
      })
      expect(adapters.deleteOrder).toHaveBeenCalledTimes(1)
    })
  })
})
