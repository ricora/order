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
import type ProductTag from "../domain/product/entities/productTag"
import * as productQueryRepository from "../domain/product/repositories/productQueryRepository"
import * as productTagQueryRepository from "../domain/product/repositories/productTagQueryRepository"
import { getProductsManagementPageData } from "./getProductsManagementPageData"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

const mockProducts: Product[] = [
  {
    id: 1,
    name: "テスト商品A",
    image: "https://example.com/a.png",
    tagIds: [1, 2],
    price: 100,
    stock: 10,
  },
  {
    id: 2,
    name: "テスト商品B",
    image: "https://example.com/b.png",
    tagIds: [2],
    price: 200,
    stock: 0,
  },
  {
    id: 3,
    name: "テスト商品C",
    image: "https://example.com/c.png",
    tagIds: [],
    price: 300,
    stock: 3,
  },
]

describe("getProductsManagementPageData", () => {
  beforeAll(() => {
    spyOn(productQueryRepository, "findAllProducts").mockImplementation(
      async () => mockProducts,
    )
    spyOn(productTagQueryRepository, "findAllProductTags").mockImplementation(
      async () => mockTags,
    )
  })
  afterAll(() => {
    mock.restore()
  })

  it("商品・タグ・集計値を正しく取得できる", async () => {
    const result = await getProductsManagementPageData()
    expect(result.tags).toEqual(mockTags)
    expect(result.products.length).toBe(3)

    expect(result.products.map((p) => p.tags)).toEqual([
      ["人気", "メイン"],
      ["メイン"],
      [],
    ])

    expect(result.totalProducts).toBe(3)
    expect(result.lowStockCount).toBe(1)
    expect(result.outOfStockCount).toBe(1)
    expect(result.totalValue).toBe(100 * 10 + 200 * 0 + 300 * 3)
  })
})
