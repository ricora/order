import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import type Product from "../domain/product/entities/product"
import * as productQueryRepository from "../domain/product/repositories/productQueryRepository"
import * as productTagQueryRepository from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import {
  exportProductCatalogCsv,
  PRODUCT_CATALOG_EXPORT_PAGE_SIZE,
} from "./exportProductCatalogCsv"

const dbClient = {} as DbClient

const mockProduct = (id: number, overrides?: Partial<Product>): Product => ({
  id,
  name: `Product ${id}`,
  image: `https://example.com/${id}`,
  price: 500,
  stock: 10,
  tagIds: [],
  ...overrides,
})

describe("exportProductCatalogCsv", () => {
  afterEach(() => {
    mock.restore()
  })

  it("タグ付きの商品をCSV行に変換する", async () => {
    const products: Product[] = [
      mockProduct(1, { name: "Blend", tagIds: [2, 1], price: 450 }),
      mockProduct(2, { name: "Latte", tagIds: [2], image: null, stock: 0 }),
    ]

    spyOn(productQueryRepository, "findAllProducts").mockImplementation(
      async ({ pagination }) => {
        if (pagination.offset === 0) {
          return products
        }
        return []
      },
    )

    spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockResolvedValue([
      { id: 1, name: "Blend" },
      { id: 2, name: "Seasonal" },
    ])

    const result = await exportProductCatalogCsv({ dbClient })

    expect(result.productCount).toBe(2)
    expect(result.exportedAt).toBeInstanceOf(Date)

    expect(result.csv).toBe(
      [
        "product_id,product_name,price,stock,image_url,tag_ids,tag_names,tag_count",
        "1,Blend,450,10,https://example.com/1,1|2,Blend|Seasonal,2",
        "2,Latte,500,0,,2,Seasonal,1",
      ].join("\n"),
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

    const findProductsSpy = spyOn(
      productQueryRepository,
      "findAllProducts",
    ).mockImplementation(async ({ pagination }) => {
      if (pagination.offset === 0) {
        expect(pagination.limit).toBe(PRODUCT_CATALOG_EXPORT_PAGE_SIZE + 1)
        return firstPage
      }
      if (pagination.offset === PRODUCT_CATALOG_EXPORT_PAGE_SIZE) {
        expect(pagination.limit).toBe(PRODUCT_CATALOG_EXPORT_PAGE_SIZE + 1)
        return secondPage
      }
      return []
    })

    const findTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockResolvedValue([{ id: 1, name: "Tag1" }])

    const result = await exportProductCatalogCsv({ dbClient })

    expect(findProductsSpy).toHaveBeenCalledTimes(2)
    expect(findTagsSpy).toHaveBeenCalledTimes(1)
    expect(result.productCount).toBe(
      PRODUCT_CATALOG_EXPORT_PAGE_SIZE + secondPage.length,
    )
  })

  it("タグなしの商品ではタグ名を読み込まない", async () => {
    const products: Product[] = [mockProduct(1, { tagIds: [] })]

    spyOn(productQueryRepository, "findAllProducts").mockImplementation(
      async () => products,
    )

    const findTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTagsByIds",
    ).mockResolvedValue([])

    const result = await exportProductCatalogCsv({ dbClient })

    expect(findTagsSpy).not.toHaveBeenCalled()
    const [, row] = result.csv.split("\n")
    if (!row) throw new Error("expected one data row")
    const columns = row.split(",")
    expect(columns[5]).toBe("") // tag_ids
    expect(columns[6]).toBe("") // tag_names
    expect(columns[7]).toBe("0") // tag_count
  })
})
