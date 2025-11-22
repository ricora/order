import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import { MAX_STORE_PRODUCT_COUNT } from "../domain/product/constants"
import type Product from "../domain/product/entities/product"
import type ProductTag from "../domain/product/entities/productTag"
import * as productQueryRepository from "../domain/product/repositories/productQueryRepository"
import * as productTagQueryRepository from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { getOrderRegistrationFormComponentData } from "./getOrderRegistrationFormComponentData"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

const mockProducts: Product[] = [
  {
    id: 1,
    name: "テスト商品A",
    tagIds: [1, 2],
    price: 100,
    stock: 10,
  },
  {
    id: 2,
    name: "テスト商品B",
    tagIds: [2],
    price: 200,
    stock: 0,
  },
]

const dbClient = {} as DbClient

describe("getOrderRegistrationFormComponentData", () => {
  beforeAll(() => {
    spyOn(
      productQueryRepository,
      "findAllProductsOrderByIdAsc",
    ).mockImplementation(async () => mockProducts)
    spyOn(productTagQueryRepository, "findAllProductTags").mockImplementation(
      async () => mockTags,
    )
  })
  afterAll(() => {
    mock.restore()
  })

  it("商品とタグを正しく取得できる", async () => {
    const result = await getOrderRegistrationFormComponentData({ dbClient })
    expect(result.products.length).toBe(2)
    expect(result.tags.length).toBe(2)

    expect(result.products[0]?.name).toBe("テスト商品A")
    expect(result.products[0]?.tags).toEqual(["人気", "メイン"])

    expect(result.tags).toEqual(mockTags)
  })

  it("ページネーションで1000件のlimitを指定している", async () => {
    const spy = spyOn(
      productQueryRepository,
      "findAllProductsOrderByIdAsc",
    ).mockImplementation(async (params) => {
      expect(params.pagination.limit).toBe(MAX_STORE_PRODUCT_COUNT)
      expect(params.pagination.offset).toBe(0)
      return mockProducts
    })

    await getOrderRegistrationFormComponentData({ dbClient })
    expect(spy).toHaveBeenCalled()
  })
})
