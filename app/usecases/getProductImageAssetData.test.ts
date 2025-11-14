import { afterAll, describe, expect, it, mock, spyOn } from "bun:test"
import * as productImageQueryRepository from "../domain/product/repositories/productImageQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { getProductImageAssetData } from "./getProductImageAssetData"

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

    spyOn(
      productImageQueryRepository,
      "findProductImageByProductId",
    ).mockImplementationOnce(async () => mockProductImage)

    const result = await getProductImageAssetData({
      dbClient,
      productImage: { productId: 1 },
    })

    expect(result.productImage).toEqual(mockProductImage)
  })

  it("商品が見つからない場合はnullを返す", async () => {
    spyOn(
      productImageQueryRepository,
      "findProductImageByProductId",
    ).mockImplementationOnce(async () => null)

    const result = await getProductImageAssetData({
      dbClient,
      productImage: { productId: 999 },
    })

    expect(result.productImage).toBeNull()
  })
})
