import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test"
import type Product from "../../domain/product/entities/product"
import type { DbClient } from "../../libs/db/client"

const mockProduct: Product = {
  id: 1,
  name: "編集テスト商品",
  tagIds: [1, 2],
  price: 500,
  stock: 50,
}

const orderRepository = {} satisfies Partial<
  typeof import("../repositories").orderRepository
>

const productRepository = {
  findProductById: mock(async (): Promise<Product | null> => mockProduct),
} satisfies Partial<typeof import("../repositories").productRepository>

mock.module("../repositories", () => ({
  orderRepository,
  productRepository,
}))

const { getProductEditPageData } = await import("./getProductEditPageData")

const dbClient = {} as DbClient

describe("getProductEditPageData", () => {
  beforeAll(() => {
    productRepository.findProductById.mockClear()
    productRepository.findProductById.mockImplementation(
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
    productRepository.findProductById.mockImplementationOnce(async () => null)

    const result = await getProductEditPageData({
      dbClient,
      product: { id: 999 },
    })
    expect(result.product).toBeNull()
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
