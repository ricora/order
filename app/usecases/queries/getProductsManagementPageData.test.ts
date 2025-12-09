import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test"
import type { Product, ProductTag } from "../../domain/product/entities"
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
  {
    id: 3,
    name: "テスト商品C",
    tagIds: [],
    price: 300,
    stock: 3,
  },
]

const orderRepository = {} satisfies Partial<
  typeof import("../repositories-provider").orderRepository
>

const productRepository = {
  findAllProductsOrderByIdAsc: mock(async () => ({
    ok: true as const,
    value: mockProducts,
  })),
  findAllProductsOrderByIdDesc: mock(async () => ({
    ok: true as const,
    value: mockProducts,
  })),
  findAllProductStocks: mock(async () => ({
    ok: true as const,
    value: [{ stock: 10 }, { stock: 0 }, { stock: 3 }],
  })),
  findAllProductTagsByIds: mock(async () => ({
    ok: true as const,
    value: mockTags,
  })),
} satisfies Partial<typeof import("../repositories-provider").productRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { getProductsManagementPageData } = await import(
  "./getProductsManagementPageData"
)

const dbClient = {} as DbClient

describe("getProductsManagementPageData", () => {
  beforeAll(() => {
    productRepository.findAllProductsOrderByIdAsc.mockImplementation(
      async () => ({ ok: true as const, value: mockProducts }),
    )
    productRepository.findAllProductsOrderByIdDesc.mockImplementation(
      async () => ({ ok: true as const, value: mockProducts }),
    )
    productRepository.findAllProductStocks.mockImplementation(async () => ({
      ok: true as const,
      value: [{ stock: 10 }, { stock: 0 }, { stock: 3 }],
    }))
    productRepository.findAllProductTagsByIds.mockImplementation(async () => ({
      ok: true as const,
      value: mockTags,
    }))
  })
  afterAll(() => {
    mock.restore()
  })

  it("商品・タグ・集計値を正しく取得できる", async () => {
    const result = await getProductsManagementPageData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.products.length).toBe(3)

    expect(result.value.products.map((p) => p.tags)).toEqual([
      ["人気", "メイン"],
      ["メイン"],
      [],
    ])

    expect(result.value.totalProducts).toBe(3)
    expect(result.value.inStockCount).toBe(1)
    expect(result.value.lowStockCount).toBe(1)
    expect(result.value.outOfStockCount).toBe(1)
    expect(result.value.hasNextPage).toBe(false)
    expect(result.value.currentPage).toBe(1)
    expect(result.value.pageSize).toBe(50)
  })

  it("各商品のステータスが正しく計算される", async () => {
    const result = await getProductsManagementPageData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.products[0]?.status).toBe("inStock")
    expect(result.value.products[1]?.status).toBe("outOfStock")
    expect(result.value.products[2]?.status).toBe("lowStock")
  })

  it("pageSize+1を取得して次ページの有無を判定できる", async () => {
    const manyProducts: Product[] = Array.from({ length: 51 }, (_, i) => ({
      id: i + 1,
      name: `商品${i + 1}`,
      image: { data: `dummy${i + 1}`, mimeType: "image/png" },
      tagIds: [],
      price: 100 * (i + 1),
      stock: i + 1,
    }))

    productRepository.findAllProductsOrderByIdAsc.mockImplementationOnce(
      async () => ({ ok: true as const, value: manyProducts }),
    )

    const result = await getProductsManagementPageData({ dbClient })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.products.length).toBe(50)
    expect(result.value.hasNextPage).toBe(true)
    expect(result.value.currentPage).toBe(1)
  })

  it("ページネーション: page=2の場合、offset計算が正しい", async () => {
    const manyProducts: Product[] = Array.from({ length: 51 }, (_, i) => ({
      id: i + 1,
      name: `商品${i + 1}`,
      image: { data: `dummy${i + 1}`, mimeType: "image/png" },
      tagIds: [],
      price: 100 * (i + 1),
      stock: i + 1,
    }))

    productRepository.findAllProductsOrderByIdAsc.mockImplementationOnce(
      async () => ({ ok: true as const, value: manyProducts }),
    )

    const result = await getProductsManagementPageData({ dbClient, page: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.currentPage).toBe(2)
    expect(result.value.pageSize).toBe(50)
  })

  it("sort='asc'で昇順を指定できる", async () => {
    const result = await getProductsManagementPageData({
      dbClient,
      sort: "asc",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.products.length).toBe(3)
  })

  it("sort='desc'で降順を指定できる", async () => {
    const result = await getProductsManagementPageData({
      dbClient,
      sort: "desc",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.products.length).toBe(3)
  })

  it("findAllProductsOrderByIdAscがドメインエラーを返す場合は汎用エラーを返す", async () => {
    productRepository.findAllProductsOrderByIdAsc.mockImplementationOnce(
      // @ts-expect-error
      async () => ({ ok: false as const, message: "secret error" }),
    )
    const res = await getProductsManagementPageData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })

  it("findAllProductsOrderByIdAscが例外を投げる場合は汎用エラーを返す", async () => {
    productRepository.findAllProductsOrderByIdAsc.mockImplementationOnce(
      async () => {
        throw new Error("unexpected")
      },
    )
    const res = await getProductsManagementPageData({ dbClient })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
  })
})
