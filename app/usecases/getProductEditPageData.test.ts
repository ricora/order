import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type Product from "../domain/product/entities/product"
import * as productQueryRepository from "../domain/product/repositories/productQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { getProductEditPageData } from "./getProductEditPageData"

const mockProduct: Product = {
  id: 1,
  name: "編集テスト商品",
  image: "https://example.com/test.png",
  tagIds: [1, 2],
  price: 500,
  stock: 50,
}

const dbClient = {} as DbClient

describe("getProductEditPageData", () => {
  beforeAll(() => {
    spyOn(productQueryRepository, "findProductById").mockImplementation(
      async () => mockProduct,
    )
  })
  afterAll(() => {
    mock.restore()
  })

  it("商品IDを指定して商品を取得できる", async () => {
    const result = await getProductEditPageData({
      dbClient,
      product: { id: 1 },
    })
    expect(result.product).toEqual(mockProduct)
    expect(result.product?.id).toBe(1)
    expect(result.product?.name).toBe("編集テスト商品")
  })

  it("商品が見つからない場合はnullを返す", async () => {
    spyOn(productQueryRepository, "findProductById").mockImplementationOnce(
      async () => null,
    )

    const result = await getProductEditPageData({
      dbClient,
      product: { id: 999 },
    })
    expect(result.product).toBeNull()
  })

  it("findProductByIdに正しいパラメータを渡している", async () => {
    const spy = spyOn(
      productQueryRepository,
      "findProductById",
    ).mockImplementation(async (params) => {
      expect(params.product.id).toBe(1)
      return mockProduct
    })

    await getProductEditPageData({
      dbClient,
      product: { id: 1 },
    })
    expect(spy).toHaveBeenCalled()
  })
})
