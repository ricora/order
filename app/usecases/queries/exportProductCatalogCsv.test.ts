import { afterEach, describe, expect, it, mock } from "bun:test"
import type { Product, ProductTag } from "../../domain/product/entities"
import type { DbClient } from "../../libs/db/client"

const mockProduct = (id: number, overrides?: Partial<Product>): Product => ({
  id,
  name: `Product ${id}`,
  price: 500,
  stock: 10,
  tagIds: [],
  ...overrides,
})

const mockProducts: Product[] = []
const mockTags: ProductTag[] = []

const orderRepository = {} satisfies Partial<
  typeof import("../repositories-provider").orderRepository
>

const productRepository = {
  findAllProductsOrderByIdAsc: mock(async (_) => ({
    ok: true as const,
    value: mockProducts,
  })),
  findAllProductTagsByIds: mock(async (_) => ({
    ok: true as const,
    value: mockTags,
  })),
} satisfies Partial<typeof import("../repositories-provider").productRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { exportProductCatalogCsv, PRODUCT_CATALOG_EXPORT_PAGE_SIZE } =
  await import("./exportProductCatalogCsv")

const dbClient = {} as DbClient

describe("exportProductCatalogCsv", () => {
  afterEach(() => {
    mock.restore()
    productRepository.findAllProductsOrderByIdAsc.mockClear()
    productRepository.findAllProductTagsByIds.mockClear()
  })

  it("タグ付きの商品をCSV行に変換する", async () => {
    const products: Product[] = [
      mockProduct(1, { name: "Blend", tagIds: [2, 1], price: 450 }),
      mockProduct(2, { name: "Latte", tagIds: [2], stock: 0 }),
    ]

    productRepository.findAllProductsOrderByIdAsc.mockImplementation(
      async ({ pagination }) => {
        if (pagination.offset === 0) {
          return { ok: true as const, value: products }
        }
        return { ok: true as const, value: [] }
      },
    )

    productRepository.findAllProductTagsByIds.mockResolvedValue({
      ok: true as const,
      value: [
        { id: 1, name: "Blend" },
        { id: 2, name: "Seasonal" },
      ],
    })

    const result = await exportProductCatalogCsv({
      dbClient,
      imageBaseUrl: "https://example.com",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.productCount).toBe(2)
    expect(result.value.exportedAt).toBeInstanceOf(Date)

    const calledIds =
      productRepository.findAllProductTagsByIds.mock.calls.flatMap(
        (c) => c?.[0]?.productTag?.ids ?? [],
      )
    expect(new Set(calledIds)).toEqual(new Set([1, 2]))
    expect(result.value.csv).toBe(
      `${[
        "product_id,product_name,price,stock,image_url,tag_ids,tag_names,tag_count",
        "1,Blend,450,10,https://example.com/images/products/1,1|2,Blend|Seasonal,2",
        "2,Latte,500,0,https://example.com/images/products/2,2,Seasonal,1",
      ].join("\n")}\n`,
    )
  })

  it("複数ページの商品を取得する", async () => {
    const firstPage = Array.from(
      { length: PRODUCT_CATALOG_EXPORT_PAGE_SIZE + 1 },
      (_, i) => mockProduct(i + 1, { tagIds: [1] }),
    )
    const secondPage = [
      mockProduct(PRODUCT_CATALOG_EXPORT_PAGE_SIZE + 1, { tagIds: [1] }),
    ]

    productRepository.findAllProductsOrderByIdAsc.mockImplementation(
      async ({ pagination }) => {
        if (pagination.offset === 0) {
          expect(pagination.limit).toBe(PRODUCT_CATALOG_EXPORT_PAGE_SIZE + 1)
          return { ok: true as const, value: firstPage }
        }
        if (pagination.offset === PRODUCT_CATALOG_EXPORT_PAGE_SIZE) {
          expect(pagination.limit).toBe(PRODUCT_CATALOG_EXPORT_PAGE_SIZE + 1)
          return { ok: true as const, value: secondPage }
        }
        return { ok: true as const, value: [] }
      },
    )

    productRepository.findAllProductTagsByIds.mockResolvedValue({
      ok: true as const,
      value: [{ id: 1, name: "Tag1" }],
    })

    const result = await exportProductCatalogCsv({
      dbClient,
      imageBaseUrl: "https://example.com",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(productRepository.findAllProductsOrderByIdAsc).toHaveBeenCalledTimes(
      2,
    )
    expect(productRepository.findAllProductTagsByIds).toHaveBeenCalledTimes(1)
    expect(result.value.productCount).toBe(
      PRODUCT_CATALOG_EXPORT_PAGE_SIZE + secondPage.length,
    )
  })

  it("タグなしの商品ではタグ名を読み込まない", async () => {
    const products: Product[] = [mockProduct(1, { tagIds: [] })]

    productRepository.findAllProductsOrderByIdAsc.mockImplementation(
      async () => ({ ok: true as const, value: products }),
    )

    productRepository.findAllProductTagsByIds.mockResolvedValue({
      ok: true as const,
      value: [],
    })

    const result = await exportProductCatalogCsv({
      dbClient,
      imageBaseUrl: "https://example.com",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(productRepository.findAllProductTagsByIds).not.toHaveBeenCalled()
    const [, row] = result.value.csv.split("\n")
    if (!row) throw new Error("expected one data row")
    const columns = row.split(",")
    expect(columns[5]).toBe("") // tag_ids
    expect(columns[6]).toBe("") // tag_names
    expect(columns[7]).toBe("0") // tag_count
  })
})
