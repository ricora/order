import { afterAll, describe, expect, it, mock } from "bun:test"
import type ProductImage from "../../domain/product/entities/productImage"
import type { DbClient } from "../../libs/db/client"

const orderRepository = {} satisfies Partial<
  typeof import("../repositories-provider").orderRepository
>

const productRepository = {
  findProductImageByProductId: mock(
    async (): Promise<ProductImage | null> => null,
  ),
} satisfies Partial<typeof import("../repositories-provider").productRepository>

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
    }

    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => mockProductImage,
    )

    const result = await getProductImageAssetData({
      dbClient,
      productImage: { productId: 1 },
    })

    expect(result.productImage).toEqual(mockProductImage)
  })

  it("商品が見つからない場合はnullを返す", async () => {
    productRepository.findProductImageByProductId.mockImplementationOnce(
      async () => null,
    )

    const result = await getProductImageAssetData({
      dbClient,
      productImage: { productId: 999 },
    })

    expect(result.productImage).toBeNull()
  })
})
