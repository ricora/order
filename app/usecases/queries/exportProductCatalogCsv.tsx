import type { Product } from "../../domain/product/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { toCsv } from "../../utils/csv"
import { productRepository } from "../repositories-provider"

const { findAllProductsOrderByIdAsc, findAllProductTagsByIds } =
  productRepository

export const PRODUCT_CATALOG_EXPORT_PAGE_SIZE = 200

export const PRODUCT_CATALOG_COLUMNS = [
  {
    name: "product_id",
    description: "商品ID（一意の識別子）",
  },
  {
    name: "product_name",
    description: "商品名",
  },
  {
    name: "price",
    description: "価格（円）",
  },
  {
    name: "stock",
    description: "在庫数",
  },
  {
    name: "image_url",
    description: "商品画像URL（絶対URL）",
  },
  {
    name: "tag_ids",
    description: (
      <>
        タグID（パイプ区切り、例: <code>1|3|5</code>）
      </>
    ),
  },
  {
    name: "tag_names",
    description: (
      <>
        タグ名（パイプ区切り、例: <code>飲料|冷凍</code>）
      </>
    ),
  },
  {
    name: "tag_count",
    description: "タグ数",
  },
] as const

export const PRODUCT_CATALOG_HEADER = PRODUCT_CATALOG_COLUMNS.map(
  (col) => col.name,
)

export type ExportProductCatalogCsvParams = {
  dbClient: DbClient
  imageBaseUrl: string
}

export type ExportProductCatalogCsvResult = {
  csv: string
  exportedAt: Date
  productCount: number
}

const fetchAllProducts = async (
  dbClient: DbClient,
): Promise<Result<Product[], "エラーが発生しました。">> => {
  const products: Product[] = []
  const pageSize = PRODUCT_CATALOG_EXPORT_PAGE_SIZE
  const limit = pageSize + 1

  while (true) {
    const chunkResult = await findAllProductsOrderByIdAsc({
      dbClient,
      pagination: {
        offset: products.length,
        limit,
      },
    })
    if (!chunkResult.ok) {
      return { ok: false, message: "エラーが発生しました。" }
    }
    const chunk = chunkResult.value

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

  return { ok: true, value: products }
}

const buildTagMap = async (
  dbClient: DbClient,
  products: Product[],
): Promise<Result<Map<number, string>, "エラーが発生しました。">> => {
  const uniqueTagIds = Array.from(
    new Set(products.flatMap((product) => product.tagIds)),
  )
  if (uniqueTagIds.length === 0)
    return { ok: true, value: new Map<number, string>() }

  const tagsResult = await findAllProductTagsByIds({
    dbClient,
    pagination: {
      offset: 0,
      limit: uniqueTagIds.length,
    },
    productTag: {
      ids: uniqueTagIds,
    },
  })
  if (!tagsResult.ok) return { ok: false, message: "エラーが発生しました。" }
  const map = new Map(tagsResult.value.map((tag) => [tag.id, tag.name]))
  const missingIds = uniqueTagIds.filter((id) => !map.has(id))
  if (missingIds.length > 0) {
    const moreResult = await findAllProductTagsByIds({
      dbClient,
      pagination: { offset: 0, limit: missingIds.length },
      productTag: { ids: missingIds },
    })
    if (moreResult.ok) {
      for (const tag of moreResult.value) map.set(tag.id, tag.name)
    }
  }
  return { ok: true, value: map }
}

const buildProductRows = async (
  products: Product[],
  tagMap: Map<number, string>,
  imageBaseUrl: string,
) => {
  return Promise.all(
    products.map(async (product) => {
      const sortedTagIds = [...product.tagIds].sort((a, b) => a - b)
      const tagNames = sortedTagIds
        .map((id) => tagMap.get(id))
        .filter((name): name is string => Boolean(name))
      return [
        product.id,
        product.name,
        product.price,
        product.stock,
        new URL(`/images/products/${product.id}`, imageBaseUrl).toString(),
        sortedTagIds.join("|"),
        tagNames.join("|"),
        sortedTagIds.length,
      ]
    }),
  )
}

export const exportProductCatalogCsv = async ({
  dbClient,
  imageBaseUrl,
}: ExportProductCatalogCsvParams): Promise<
  Result<ExportProductCatalogCsvResult, "エラーが発生しました。">
> => {
  const productsResult = await fetchAllProducts(dbClient)
  if (!productsResult.ok)
    return { ok: false, message: "エラーが発生しました。" }
  const products = productsResult.value
  const tagMapResult = await buildTagMap(dbClient, products)
  if (!tagMapResult.ok) return { ok: false, message: "エラーが発生しました。" }
  const tagMap = tagMapResult.value
  const rows = await buildProductRows(products, tagMap, imageBaseUrl)
  const csvRows =
    rows.length > 0
      ? [PRODUCT_CATALOG_HEADER, ...rows]
      : [PRODUCT_CATALOG_HEADER]
  const csv = toCsv(csvRows)
  return {
    ok: true,
    value: { csv, exportedAt: new Date(), productCount: products.length },
  }
}
