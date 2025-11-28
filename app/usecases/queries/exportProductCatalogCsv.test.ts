import { afterEach, describe, expect, it, mock } from "bun:test"
import type Product from "../../domain/product/entities/product"
import type ProductTag from "../../domain/product/entities/productTag"
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
  findAllProductsOrderByIdAsc: mock(async (_) => mockProducts),
  findAllProductTagsByIds: mock(async (_) => mockTags),
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
          return products
        }
        return []
      },
    )

    productRepository.findAllProductTagsByIds.mockResolvedValue([
      { id: 1, name: "Blend" },
      { id: 2, name: "Seasonal" },
    ])

    const result = await exportProductCatalogCsv({
      dbClient,
      imageBaseUrl: "https://example.com",
    })

    expect(result.productCount).toBe(2)
    expect(result.exportedAt).toBeInstanceOf(Date)

    expect(result.csv).toBe(
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
          return firstPage
        }
        if (pagination.offset === PRODUCT_CATALOG_EXPORT_PAGE_SIZE) {
          expect(pagination.limit).toBe(PRODUCT_CATALOG_EXPORT_PAGE_SIZE + 1)
          return secondPage
        }
        return []
      },
    )

    productRepository.findAllProductTagsByIds.mockResolvedValue([
      { id: 1, name: "Tag1" },
    ])

    const result = await exportProductCatalogCsv({
      dbClient,
      imageBaseUrl: "https://example.com",
    })

    expect(productRepository.findAllProductsOrderByIdAsc).toHaveBeenCalledTimes(
      2,
    )
    expect(productRepository.findAllProductTagsByIds).toHaveBeenCalledTimes(1)
    expect(result.productCount).toBe(
      PRODUCT_CATALOG_EXPORT_PAGE_SIZE + secondPage.length,
    )
  })

  it("タグなしの商品ではタグ名を読み込まない", async () => {
    const products: Product[] = [mockProduct(1, { tagIds: [] })]

    productRepository.findAllProductsOrderByIdAsc.mockImplementation(
      async () => products,
    )

    productRepository.findAllProductTagsByIds.mockResolvedValue([])

    const result = await exportProductCatalogCsv({
      dbClient,
      imageBaseUrl: "https://example.com",
    })

    expect(productRepository.findAllProductTagsByIds).not.toHaveBeenCalled()
    const [, row] = result.csv.split("\n")
    if (!row) throw new Error("expected one data row")
    const columns = row.split(",")
    expect(columns[5]).toBe("") // tag_ids
    expect(columns[6]).toBe("") // tag_names
    expect(columns[7]).toBe("0") // tag_count
  })
})
