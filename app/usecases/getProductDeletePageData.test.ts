import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import { MAX_TAGS_PER_PRODUCT } from "../domain/product/constants"
import type Product from "../domain/product/entities/product"
import type ProductTag from "../domain/product/entities/productTag"
import * as productQueryRepository from "../domain/product/repositories/productQueryRepository"
import * as productTagQueryRepository from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { getProductDeletePageData } from "./getProductDeletePageData"

const mockProduct: Product = {
  id: 1,
  name: "削除テスト商品",
  tagIds: [1, 2],
  price: 500,
  stock: 50,
}

const mockTags: ProductTag[] = [
  { id: 1, name: "タグA" },
  { id: 2, name: "タグB" },
]

const dbClient = {} as DbClient

describe("getProductDeletePageData", () => {
  beforeAll(() => {
    spyOn(productQueryRepository, "findProductById").mockImplementation(
      async () => mockProduct,
    )

    spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockImplementation(async () => mockTags)
  })

  afterAll(() => {
    mock.restore()
  })

  it("商品削除ページ用のデータを取得できる", async () => {
    const result = await getProductDeletePageData({
      dbClient,
      product: { id: 1 },
    })

    expect(result.product).not.toBeNull()
    expect(result.product?.id).toBe(1)
    expect(result.product?.name).toBe("削除テスト商品")
    expect(result.product?.tags).toEqual(["タグA", "タグB"])
  })

  it("商品が見つからない場合はnullを返す", async () => {
    spyOn(productQueryRepository, "findProductById").mockImplementationOnce(
      async () => null,
    )

    const result = await getProductDeletePageData({
      dbClient,
      product: { id: 999 },
    })
    expect(result.product).toBeNull()
  })

  it("タグの取得に正しいパラメータを渡している", async () => {
    const spy = spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockImplementation(async (params) => {
      expect(params.productTag.ids).toEqual(mockProduct.tagIds)
      expect(params.pagination).toEqual({
        offset: 0,
        limit: MAX_TAGS_PER_PRODUCT,
      })
      return mockTags
    })

    await getProductDeletePageData({ dbClient, product: { id: 1 } })
    expect(spy).toHaveBeenCalled()
  })
})
