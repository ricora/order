import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test"
import { MAX_STORE_PRODUCT_TAG_COUNT } from "../../domain/product/constants"
import type ProductTag from "../../domain/product/entities/productTag"
import type { DbClient } from "../../libs/db/client"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
  { id: 3, name: "限定" },
]

const orderRepository = {} satisfies Partial<
  typeof import("../repositories-provider").orderRepository
>

const productRepository = {
  findAllProductTags: mock(async () => ({
    ok: true as const,
    value: mockTags,
  })),
} satisfies Partial<typeof import("../repositories-provider").productRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { getProductRegistrationFormComponentData } = await import(
  "./getProductRegistrationFormComponentData"
)

const dbClient = {} as DbClient

describe("getProductRegistrationFormComponentData", () => {
  beforeAll(() => {
    productRepository.findAllProductTags.mockClear()
    productRepository.findAllProductTags.mockImplementation(async () => ({
      ok: true as const,
      value: mockTags,
    }))
  })
  afterAll(() => {
    mock.restore()
  })

  it("すべてのタグを取得できる", async () => {
    const result = await getProductRegistrationFormComponentData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.tags.length).toBe(3)
    expect(result.value.tags).toEqual(mockTags)
  })

  it("ページネーションで1000件のlimitを指定している", async () => {
    await getProductRegistrationFormComponentData({ dbClient })
    expect(productRepository.findAllProductTags).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { limit: MAX_STORE_PRODUCT_TAG_COUNT, offset: 0 },
      }),
    )
  })

  it("タグが空の場合も正しく返す", async () => {
    productRepository.findAllProductTags.mockImplementationOnce(async () => ({
      ok: true as const,
      value: [],
    }))

    const result = await getProductRegistrationFormComponentData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.tags).toEqual([])
  })

  it("findAllProductTagsがドメインエラーを返す場合は汎用エラーを返す", async () => {
    // @ts-expect-error
    productRepository.findAllProductTags.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "secret error",
    }))
    const res = await getProductRegistrationFormComponentData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findAllProductTagsが例外を投げる場合は汎用エラーを返す", async () => {
    productRepository.findAllProductTags.mockImplementationOnce(async () => {
      throw new Error("unexpected")
    })
    const res = await getProductRegistrationFormComponentData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })
})
