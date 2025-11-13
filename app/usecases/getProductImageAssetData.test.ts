import { afterAll, describe, expect, it, mock, spyOn } from "bun:test"
import type Product from "../domain/product/entities/product"
import * as productQueryRepository from "../domain/product/repositories/productQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { getProductImageAssetData } from "./getProductImageAssetData"

const dbClient = {} as DbClient

describe("getProductImageAssetData", () => {
  afterAll(() => {
    mock.restore()
  })

  it("商品の画像データを取得できる", async () => {
    const mockProduct: Product = {
      id: 1,
      name: "テスト商品",
      image: {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mimeType: "image/png",
      },
      tagIds: [1],
      price: 100,
      stock: 10,
    }

    spyOn(productQueryRepository, "findProductById").mockImplementationOnce(
      async () => mockProduct,
    )

    const result = await getProductImageAssetData({
      dbClient,
      product: { id: 1 },
    })

    expect(result.product).toEqual({
      image: {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        mimeType: "image/png",
      },
    })
  })

  it("商品が見つからない場合はnullを返す", async () => {
    spyOn(productQueryRepository, "findProductById").mockImplementationOnce(
      async () => null,
    )

    const result = await getProductImageAssetData({
      dbClient,
      product: { id: 999 },
    })

    expect(result.product).toBeNull()
  })

  it("商品の画像がnullの場合は画像データがnullの商品データを返す", async () => {
    const mockProduct: Product = {
      id: 2,
      name: "画像なし商品",
      image: null,
      tagIds: [],
      price: 50,
      stock: 5,
    }

    spyOn(productQueryRepository, "findProductById").mockImplementationOnce(
      async () => mockProduct,
    )

    const result = await getProductImageAssetData({
      dbClient,
      product: { id: 2 },
    })

    expect(result.product).toEqual({ image: null })
  })
})
