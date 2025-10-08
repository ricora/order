import { describe, expect, it } from "bun:test"
import type { TransactionDbClient } from "../../../infrastructure/db/client"
import type Order from "../entities/order"
import { createOrder } from "./orderCommandRepository"

const baseOrder: Omit<Order, "id"> = {
  customerName: "Taro",
  createdAt: new Date(),
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
    await expect(
      createOrder({
        order: { ...baseOrder, totalAmount: 999 },
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("合計金額が正しくありません")
  })

  it("顧客名が長すぎる場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const longName = "あ".repeat(51)
    await expect(
      createOrder({
        order: { ...baseOrder, customerName: longName },
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("顧客名は50文字以内である必要があります")
  })

  it("注文項目が0件の場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: [], totalAmount: 0 },
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("注文項目は1種類以上20種類以下である必要があります")
  })

  it("注文項目の数量が0の場合はエラーを投げる", async () => {
    const mockDbClient = {} as TransactionDbClient
    const badItems = [
      { productId: 1, productName: "A", unitAmount: 100, quantity: 0 },
    ]
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: badItems, totalAmount: 0 },
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("注文項目の数量は1以上である必要があります")
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
    await expect(
      createOrder({
        order: { ...baseOrder, orderItems: badItems, totalAmount: 100 },
        dbClient: mockDbClient,
      }),
    ).rejects.toThrow("商品名は1文字以上500文字以内である必要があります")
  })
})
