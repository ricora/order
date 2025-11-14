import type Product from "../domain/product/entities/product"
import { findAllProducts } from "../domain/product/repositories/productQueryRepository"
import { findAllProductTagsByIds } from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { toCsv } from "../utils/csv"

export const PRODUCT_CATALOG_EXPORT_PAGE_SIZE = 200

const PRODUCT_CATALOG_HEADER = [
  "product_id",
  "product_name",
  "price",
  "stock",
  "image_url",
  "tag_ids",
  "tag_names",
  "tag_count",
]

export type ExportProductCatalogCsvParams = {
  dbClient: DbClient
}

export type ExportProductCatalogCsvResult = {
  csv: string
  exportedAt: Date
  productCount: number
}

const fetchAllProducts = async (dbClient: DbClient): Promise<Product[]> => {
  const products: Product[] = []
  const pageSize = PRODUCT_CATALOG_EXPORT_PAGE_SIZE
  const limit = pageSize + 1

  while (true) {
    const chunk = await findAllProducts({
      dbClient,
      pagination: {
        offset: products.length,
        limit,
      },
    })

    if (chunk.length === 0) {
      break
    }

    const hasNextPage = chunk.length > pageSize
    const rowsToAppend = hasNextPage ? chunk.slice(0, pageSize) : chunk
    products.push(...rowsToAppend)

    if (!hasNextPage) {
      break
    }
  }

  return products
}

const buildTagMap = async (dbClient: DbClient, products: Product[]) => {
  const uniqueTagIds = Array.from(
    new Set(products.flatMap((product) => product.tagIds)),
  )
  if (uniqueTagIds.length === 0) return new Map<number, string>()

  const tags = await findAllProductTagsByIds({
    dbClient,
    pagination: {
      offset: 0,
      limit: uniqueTagIds.length,
    },
    productTag: {
      ids: uniqueTagIds,
    },
  })
  return new Map(tags.map((tag) => [tag.id, tag.name]))
}

const buildProductRows = (products: Product[], tagMap: Map<number, string>) => {
  return products.map((product) => {
    const sortedTagIds = [...product.tagIds].sort((a, b) => a - b)
    const tagNames = sortedTagIds
      .map((tagId) => tagMap.get(tagId))
      .filter((name): name is string => Boolean(name))
    return [
      product.id,
      product.name,
      product.price,
      product.stock,
      product.image ?? "",
      sortedTagIds.join("|"),
      tagNames.join("|"),
      sortedTagIds.length,
    ]
  })
}

export const exportProductCatalogCsv = async ({
  dbClient,
}: ExportProductCatalogCsvParams): Promise<ExportProductCatalogCsvResult> => {
  const products = await fetchAllProducts(dbClient)
  const tagMap = await buildTagMap(dbClient, products)
  const rows = buildProductRows(products, tagMap)
  const csvRows =
    rows.length > 0
      ? [PRODUCT_CATALOG_HEADER, ...rows]
      : [PRODUCT_CATALOG_HEADER]
  const csv = toCsv(csvRows)
  return {
    csv,
    exportedAt: new Date(),
    productCount: products.length,
  }
}
