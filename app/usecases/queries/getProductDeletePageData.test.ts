import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test"
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

type ProductRepository =
  typeof import("../repositories-provider").productRepository
type MockProductRepository = {
  [K in keyof ProductRepository]: Mock<ProductRepository[K]>
}

const productRepository = {
  findProductById: mock<ProductRepository["findProductById"]>(async () => ({
    ok: true as const,
    value: mockProduct,
  })),
  findAllProductTagsByIds: mock<ProductRepository["findAllProductTagsByIds"]>(
    async () => ({
      ok: true as const,
      value: mockTags,
    }),
  ),
} satisfies Partial<MockProductRepository>

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
    productRepository.findProductById.mockImplementation(async () => ({
      ok: true as const,
      value: mockProduct,
    }))
    productRepository.findAllProductTagsByIds.mockImplementation(async () => ({
      ok: true as const,
      value: mockTags,
    }))
  })

  afterAll(() => {
    mock.restore()
  })

  it("商品削除ページ用のデータを取得できる", async () => {
    const result = await getProductDeletePageData({
      dbClient,
      product: { id: 1 },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.product).not.toBeNull()
    expect(result.value.product?.id).toBe(1)
    expect(result.value.product?.name).toBe("削除テスト商品")
    expect(result.value.product?.tags).toEqual(["タグA", "タグB"])
  })

  it("商品が見つからない場合は'商品が見つかりません。'エラーを返す", async () => {
    productRepository.findProductById.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "商品が見つかりません。",
    }))

    const result = await getProductDeletePageData({
      dbClient,
      product: { id: 999 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("商品が見つかりません。")
  })

  it("findProductByIdがドメインエラーを返す場合は汎用エラーを返す", async () => {
    productRepository.findProductById.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "エラーが発生しました。",
    }))
    const res = await getProductDeletePageData({ dbClient, product: { id: 1 } })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findProductByIdが例外を投げる場合は汎用エラーを返す", async () => {
    productRepository.findProductById.mockImplementationOnce(async () => {
      throw new Error("unexpected")
    })
    const res = await getProductDeletePageData({ dbClient, product: { id: 1 } })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findAllProductTagsByIdsがドメインエラーを返す場合は汎用エラーを返す", async () => {
    productRepository.findAllProductTagsByIds.mockImplementationOnce(
      async () => ({ ok: false as const, message: "エラーが発生しました。" }),
    )
    const res = await getProductDeletePageData({ dbClient, product: { id: 1 } })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
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
