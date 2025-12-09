import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test"
import type { Product } from "../../domain/product/entities"
import type { DbClient } from "../../libs/db/client"

const mockProduct: Product = {
  id: 1,
  name: "編集テスト商品",
  tagIds: [1, 2],
  price: 500,
  stock: 50,
}

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
} satisfies Partial<MockProductRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { getProductEditPageData } = await import("./getProductEditPageData")

const dbClient = {} as DbClient

describe("getProductEditPageData", () => {
  beforeAll(() => {
    productRepository.findProductById.mockClear()
    productRepository.findProductById.mockImplementation(async () => ({
      ok: true as const,
      value: mockProduct,
    }))
  })
  afterAll(() => {
    mock.restore()
  })

  it("商品IDを指定して商品を取得できる", async () => {
    const result = await getProductEditPageData({
      dbClient,
      product: { id: 1 },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.product).toEqual(mockProduct)
    expect(result.value.product?.id).toBe(1)
    expect(result.value.product?.name).toBe("編集テスト商品")
  })

  it("商品が見つからない場合はエラーを返す", async () => {
    productRepository.findProductById.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "商品が見つかりません。",
    }))

    const result = await getProductEditPageData({
      dbClient,
      product: { id: 999 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("商品が見つかりません。")
  })

  it("リポジトリが例外を投げる場合は汎用エラーを返す", async () => {
    productRepository.findProductById.mockImplementationOnce(async () => {
      throw new Error("unexpected")
    })
    const result = await getProductEditPageData({
      dbClient,
      product: { id: 999 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("エラーが発生しました。")
  })

  it("findProductByIdに正しいパラメータを渡している", async () => {
    await getProductEditPageData({
      dbClient,
      product: { id: 1 },
    })
    expect(productRepository.findProductById).toHaveBeenCalledWith(
      expect.objectContaining({
        product: { id: 1 },
      }),
    )
  })
})
