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
import type { DbClient } from "../infrastructure/db/client"
import { getProductsManagementPageData } from "./getProductsManagementPageData"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

const mockProducts: Product[] = [
  {
    id: 1,
    name: "テスト商品A",
    image: { data: "dummyA", mimeType: "image/png" },
    tagIds: [1, 2],
    price: 100,
    stock: 10,
  },
  {
    id: 2,
    name: "テスト商品B",
    image: { data: "dummyB", mimeType: "image/png" },
    tagIds: [2],
    price: 200,
    stock: 0,
  },
  {
    id: 3,
    name: "テスト商品C",
    image: { data: "dummyC", mimeType: "image/png" },
    tagIds: [],
    price: 300,
    stock: 3,
  },
]

const dbClient = {} as DbClient

describe("getProductsManagementPageData", () => {
  beforeAll(() => {
    spyOn(productQueryRepository, "findAllProducts").mockImplementation(
      async () => mockProducts,
    )
    spyOn(productQueryRepository, "findAllProductStocks").mockImplementation(
      async () => [
        { id: 1, stock: 10 },
        { id: 2, stock: 0 },
        { id: 3, stock: 3 },
      ],
    )
    spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockImplementation(async () => mockTags)
  })
  afterAll(() => {
    mock.restore()
  })

  it("商品・タグ・集計値を正しく取得できる", async () => {
    const result = await getProductsManagementPageData({ dbClient })
    expect(result.products.length).toBe(3)

    expect(result.products.map((p) => p.tags)).toEqual([
      ["人気", "メイン"],
      ["メイン"],
      [],
    ])

    expect(result.totalProducts).toBe(3)
    expect(result.inStockCount).toBe(1)
    expect(result.lowStockCount).toBe(1)
    expect(result.outOfStockCount).toBe(1)
    expect(result.hasNextPage).toBe(false)
    expect(result.currentPage).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it("各商品のステータスが正しく計算される", async () => {
    const result = await getProductsManagementPageData({ dbClient })
    expect(result.products[0]?.status).toBe("inStock")
    expect(result.products[1]?.status).toBe("outOfStock")
    expect(result.products[2]?.status).toBe("lowStock")
  })

  it("pageSize+1を取得して次ページの有無を判定できる", async () => {
    const manyProducts: Product[] = Array.from({ length: 21 }, (_, i) => ({
      id: i + 1,
      name: `商品${i + 1}`,
      image: { data: `dummy${i + 1}`, mimeType: "image/png" },
      tagIds: [],
      price: 100 * (i + 1),
      stock: i + 1,
    }))

    spyOn(productQueryRepository, "findAllProducts").mockImplementationOnce(
      async () => manyProducts,
    )

    const result = await getProductsManagementPageData({ dbClient })
    expect(result.products.length).toBe(20)
    expect(result.hasNextPage).toBe(true)
    expect(result.currentPage).toBe(1)
  })

  it("ページネーション: page=2の場合、offset計算が正しい", async () => {
    const manyProducts: Product[] = Array.from({ length: 21 }, (_, i) => ({
      id: i + 1,
      name: `商品${i + 1}`,
      image: { data: `dummy${i + 1}`, mimeType: "image/png" },
      tagIds: [],
      price: 100 * (i + 1),
      stock: i + 1,
    }))

    spyOn(productQueryRepository, "findAllProducts").mockImplementationOnce(
      async () => manyProducts,
    )

    const result = await getProductsManagementPageData({ dbClient, page: 2 })
    expect(result.currentPage).toBe(2)
    expect(result.pageSize).toBe(20)
  })
})
