import { afterAll, describe, expect, it, mock } from "bun:test"
import type { ProductImage } from "../../domain/product/entities"
import type { DbClient } from "../../libs/db/client"

const orderRepository = {} satisfies Partial<
  typeof import("../repositories-provider").orderRepository
>

type ProductRepository =
  typeof import("../repositories-provider").productRepository

const productRepository = {
  findProductImageByProductId: mock<
    ProductRepository["findProductImageByProductId"]
  >(async () => ({
    ok: false as const,
    message: "商品画像が見つかりません。",
  })),
} satisfies Partial<ProductRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { getProductImageAssetData } = await import("./getProductImageAssetData")

const dbClient = {} as DbClient

describe("getProductImageAssetData", () => {
  afterAll(() => {
    mock.restore()
  })

  it("商品の画像データを取得できる", async () => {
    const mockProductImage = {
      id: 1,
      productId: 1,
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies ProductImage

    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => ({ ok: true as const, value: mockProductImage }),
    )

    const result = await getProductImageAssetData({
      dbClient,
      productImage: { productId: 1 },
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.productImage).toEqual(mockProductImage)
  })

  it("商品が見つからない場合は'商品画像が見つかりません。'エラーを返す", async () => {
    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => ({
        ok: false as const,
        message: "商品画像が見つかりません。",
      }),
    )

    const result = await getProductImageAssetData({
      dbClient,
      productImage: { productId: 999 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("商品画像が見つかりません。")
  })

  it("リポジトリがドメインエラーを返す場合は汎用エラーを返す", async () => {
    productRepository.findProductImageByProductId.mockImplementationOnce(
      // @ts-expect-error
      async () => ({ ok: false as const, message: "secret error" }),
    )
    const result = await getProductImageAssetData({
      dbClient,
      productImage: { productId: 1 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("エラーが発生しました。")
  })

  it("リポジトリが例外を投げる場合は汎用エラーを返す", async () => {
    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => {
        throw new Error("unexpected")
      },
    )
    const result = await getProductImageAssetData({
      dbClient,
      productImage: { productId: 1 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("エラーが発生しました。")
  })
})
