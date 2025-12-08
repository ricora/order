import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test"
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
  typeof import("../repositories-provider").orderRepository
>

type ProductRepository =
  typeof import("../repositories-provider").productRepository
type MockProductRepository = {
  [K in keyof ProductRepository]: Mock<ProductRepository[K]>
}
const productRepository = {
  findAllProductsOrderByIdAsc: mock<
    ProductRepository["findAllProductsOrderByIdAsc"]
  >(async () => ({ ok: true as const, value: mockProducts })),
  findAllProductTags: mock<ProductRepository["findAllProductTags"]>(
    async () => ({ ok: true as const, value: mockTags }),
  ),
} satisfies Partial<MockProductRepository>

mock.module("../repositories-provider", () => ({
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
      async () => ({ ok: true as const, value: mockProducts }),
    )
    productRepository.findAllProductTags.mockImplementation(async () => ({
      ok: true as const,
      value: mockTags,
    }))
  })
  afterAll(() => {
    mock.restore()
  })

  it("商品とタグを正しく取得できる", async () => {
    const result = await getOrderRegistrationFormComponentData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.products.length).toBe(2)
    expect(result.value.tags.length).toBe(2)

    expect(result.value.products[0]?.name).toBe("テスト商品A")
    expect(result.value.products[0]?.tags).toEqual(["人気", "メイン"])

    expect(result.value.tags).toEqual(mockTags)
  })

  it("ページネーションで1000件のlimitを指定している", async () => {
    await getOrderRegistrationFormComponentData({ dbClient })
    expect(productRepository.findAllProductsOrderByIdAsc).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { limit: MAX_STORE_PRODUCT_COUNT, offset: 0 },
      }),
    )
  })

  it("findAllProductsOrderByIdAscがドメインエラーを返す場合は汎用エラーを返す", async () => {
    productRepository.findAllProductsOrderByIdAsc.mockImplementationOnce(
      async () => {
        return { ok: false as const, message: "エラーが発生しました。" }
      },
    )
    const res = await getOrderRegistrationFormComponentData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findAllProductsOrderByIdAscが例外を投げる場合は汎用エラーを返す", async () => {
    productRepository.findAllProductsOrderByIdAsc.mockImplementationOnce(
      async () => {
        throw new Error("unexpected")
      },
    )
    const res = await getOrderRegistrationFormComponentData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })
})
