import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test"
import { MAX_TAGS_PER_PRODUCT } from "../../domain/product/constants"
import type Product from "../../domain/product/entities/product"
import type ProductTag from "../../domain/product/entities/productTag"
import type { DbClient } from "../../libs/db/client"

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

const orderRepository = {} satisfies Partial<
  typeof import("../repositories-provider").orderRepository
>

const productRepository = {
  findProductById: mock(async (): Promise<Product | null> => mockProduct),
  findAllProductTagsByIds: mock(async () => mockTags),
} satisfies Partial<typeof import("../repositories-provider").productRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { getProductDeletePageData } = await import("./getProductDeletePageData")

const dbClient = {} as DbClient

describe("getProductDeletePageData", () => {
  beforeAll(() => {
    productRepository.findProductById.mockClear()
    productRepository.findAllProductTagsByIds.mockClear()
    productRepository.findProductById.mockImplementation(
      async () => mockProduct,
    )
    productRepository.findAllProductTagsByIds.mockImplementation(
      async () => mockTags,
    )
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
    productRepository.findProductById.mockImplementationOnce(async () => null)

    const result = await getProductDeletePageData({
      dbClient,
      product: { id: 999 },
    })
    expect(result.product).toBeNull()
  })

  it("タグの取得に正しいパラメータを渡している", async () => {
    await getProductDeletePageData({ dbClient, product: { id: 1 } })
    expect(productRepository.findAllProductTagsByIds).toHaveBeenCalledWith(
      expect.objectContaining({
        productTag: { ids: mockProduct.tagIds },
        pagination: { offset: 0, limit: MAX_TAGS_PER_PRODUCT },
      }),
    )
  })
})
