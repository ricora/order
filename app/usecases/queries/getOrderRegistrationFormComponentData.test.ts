import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test"
import { MAX_STORE_PRODUCT_COUNT } from "../../domain/product/constants"
import type Product from "../../domain/product/entities/product"
import type ProductTag from "../../domain/product/entities/productTag"
import type { DbClient } from "../../libs/db/client"

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

const orderRepository = {} satisfies Partial<
  typeof import("../repositories").orderRepository
>

const productRepository = {
  findAllProductsOrderByIdAsc: mock(async () => mockProducts),
  findAllProductTags: mock(async () => mockTags),
} satisfies Partial<typeof import("../repositories").productRepository>

mock.module("../repositories", () => ({
  orderRepository,
  productRepository,
}))

const { getOrderRegistrationFormComponentData } = await import(
  "./getOrderRegistrationFormComponentData"
)

const dbClient = {} as DbClient

describe("getOrderRegistrationFormComponentData", () => {
  beforeAll(() => {
    productRepository.findAllProductsOrderByIdAsc.mockClear()
    productRepository.findAllProductTags.mockClear()
    productRepository.findAllProductsOrderByIdAsc.mockImplementation(
      async () => mockProducts,
    )
    productRepository.findAllProductTags.mockImplementation(
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
    await getOrderRegistrationFormComponentData({ dbClient })
    expect(productRepository.findAllProductsOrderByIdAsc).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { limit: MAX_STORE_PRODUCT_COUNT, offset: 0 },
      }),
    )
  })
})
