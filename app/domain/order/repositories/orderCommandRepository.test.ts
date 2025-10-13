import { describe, expect, it, vi } from "bun:test"
import type { TransactionDbClient } from "../../../infrastructure/db/client"
import { createOrder, updateOrder } from "./orderCommandRepository"

const baseOrder: Parameters<typeof createOrder>[0]["order"] = {
  customerName: "Taro",
  createdAt: new Date(),
  status: "pending",
  totalAmount: 300,
  orderItems: [
    { productId: 1, productName: "A", unitAmount: 100, quantity: 2 },
    { productId: 2, productName: "B", unitAmount: 100, quantity: 1 },
  ],
}

describe("createOrder", () => {
  it("バリデーションを通過した注文を作成できる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] =
      async ({ order }) => ({ ...order, id: 42 })
    const result = await createOrder({
      order: baseOrder,
      dbClient: mockDbClient,
      repositoryImpl: mockImpl,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(42)
    expect(result?.totalAmount).toBe(300)
  })

  it("合計金額が一致しない場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      createOrder({
        order: { ...baseOrder, totalAmount: 999 },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("合計金額が正しくありません")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("顧客名が長すぎる場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const longName = "あ".repeat(51)
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      createOrder({
        order: { ...baseOrder, customerName: longName },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("顧客名は50文字以内である必要があります")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("注文項目が0件の場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: [], totalAmount: 0 },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("注文項目は1種類以上20種類以下である必要があります")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("注文項目の数量が0の場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const badItems = [
      { productId: 1, productName: "A", unitAmount: 100, quantity: 0 },
    ]
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: badItems, totalAmount: 0 },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("注文項目の数量は1以上である必要があります")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("商品名が長すぎる場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const longProductName = "a".repeat(501)
    const badItems = [
      {
        productId: 1,
        productName: longProductName,
        unitAmount: 100,
        quantity: 1,
      },
    ]
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: badItems, totalAmount: 100 },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("商品名は1文字以上500文字以内である必要があります")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("商品名が空の場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const badItems = [
      { productId: 1, productName: "", unitAmount: 100, quantity: 1 },
    ]
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: badItems, totalAmount: 100 },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("商品名は1文字以上500文字以内である必要があります")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("単価が負の場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const badItems = [
      { productId: 1, productName: "A", unitAmount: -10, quantity: 1 },
    ]
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: badItems, totalAmount: -10 },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("注文項目の単価は0以上である必要があります")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("注文項目が21種類ある場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const manyItems = Array.from({ length: 21 }, (_, i) => ({
      productId: i + 1,
      productName: String(i + 1),
      unitAmount: 1,
      quantity: 1,
    }))
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: manyItems, totalAmount: 21 },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("注文項目は1種類以上20種類以下である必要があります")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("顧客名がnullの場合は作成できる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const mockImpl: Parameters<typeof createOrder>[0]["repositoryImpl"] =
      async ({ order }) => ({ ...order, id: 99 })
    const result = await createOrder({
      order: { ...baseOrder, customerName: null },
      dbClient: mockDbClient,
      repositoryImpl: mockImpl,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(99)
  })
})

describe("updateOrder", () => {
  it("バリデーションを通過した注文を更新できる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const mockImpl: Parameters<typeof updateOrder>[0]["repositoryImpl"] =
      async ({ order }) => ({
        id: order.id,
        customerName: order.customerName ?? null,
        createdAt: new Date(),
        status: order.status ?? "pending",
        orderItems: baseOrder.orderItems,
        totalAmount: baseOrder.totalAmount,
      })

    const result = await updateOrder({
      order: { id: 42, customerName: "Jiro" },
      dbClient: mockDbClient,
      repositoryImpl: mockImpl,
    })
    expect(result).not.toBeNull()
    expect(result?.id).toBe(42)
    expect(result?.customerName).toBe("Jiro")
  })

  it("顧客名が長すぎる場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const longName = "あ".repeat(51)
    const mockImpl: Parameters<typeof updateOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      updateOrder({
        order: { id: 1, customerName: longName },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow("顧客名は50文字以内である必要があります")
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("不正な状態の場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const mockImpl: Parameters<typeof updateOrder>[0]["repositoryImpl"] = vi.fn(
      async () => null,
    )
    await expect(
      updateOrder({
        // @ts-expect-error invalid status
        order: { id: 1, status: "todo" },
        dbClient: mockDbClient,
        repositoryImpl: mockImpl,
      }),
    ).rejects.toThrow(
      "注文の状態は'pending', 'processing', 'completed', 'cancelled'のいずれかである必要があります",
    )
    expect(mockImpl).not.toHaveBeenCalled()
  })

  it("注文の状態を更新できる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const mockImpl: Parameters<typeof updateOrder>[0]["repositoryImpl"] =
      async ({ order }) => ({
        id: order.id,
        customerName: "X",
        createdAt: new Date(),
        status: order.status ?? "pending",
        orderItems: baseOrder.orderItems,
        totalAmount: baseOrder.totalAmount,
      })

    const result = await updateOrder({
      order: { id: 7, status: "processing" },
      dbClient: mockDbClient,
      repositoryImpl: mockImpl,
    })
    expect(result).not.toBeNull()
    expect(result?.status).toBe("processing")
  })
})
