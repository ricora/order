import type { Product } from "../../domain/product/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { toCsv } from "../../utils/csv"
import { productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { findAllProductsOrderByIdAsc, findAllProductTagsByIds } =
  productRepository

export const PRODUCT_CATALOG_EXPORT_PAGE_SIZE = 200

export const PRODUCT_CATALOG_COLUMNS = [
  "product_id",
  "product_name",
  "price",
  "stock",
  "image_url",
  "tag_ids",
  "tag_names",
  "tag_count",
] as const

export const PRODUCT_CATALOG_HEADER = [...PRODUCT_CATALOG_COLUMNS]

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

export type ExportProductCatalogCsv = UsecaseFunction<
  { imageBaseUrl: string },
  { csv: string; exportedAt: Date; productCount: number },
  "エラーが発生しました。"
>

export const exportProductCatalogCsv: ExportProductCatalogCsv = async ({
  dbClient,
  imageBaseUrl,
}) => {
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
