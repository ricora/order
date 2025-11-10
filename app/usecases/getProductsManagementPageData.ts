import type Product from "../domain/product/entities/product"
import {
  findAllProductStocks,
  findAllProducts,
} from "../domain/product/repositories/productQueryRepository"
import { findAllProductTagsByIds } from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetProductsManagementPageDataParams = {
  dbClient: DbClient
  page?: number
}

export type ProductsManagementPageData = {
  products: (Omit<Product, "image" | "tagIds"> & {
    image: string
    tags: string[]
  })[]
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
  hasNextPage: boolean
  currentPage: number
  pageSize: number
}

export const getProductsManagementPageData = async ({
  dbClient,
  page = 1,
}: GetProductsManagementPageDataParams): Promise<ProductsManagementPageData> => {
  const pageSize = 20
  const offset = Math.max(0, (page - 1) * pageSize)

  const productsWithExtra = await findAllProducts({
    dbClient,
    pagination: { offset, limit: pageSize + 1 },
  })
  const hasNextPage = productsWithExtra.length > pageSize
  const products = productsWithExtra.slice(0, pageSize)

  const tags = await findAllProductTagsByIds({
    dbClient,
    pagination: {
      offset: 0,
      limit: 1000,
    },
    productTag: { ids: products.flatMap((p) => p.tagIds) },
  })
  const tagMap = new Map<number, string>(tags.map((tag) => [tag.id, tag.name]))

  const managementProducts = products.map((product) => ({
    ...product,
    // TODO: デフォルト画像を正式なものに差し替える
    image: product.image ?? "https://picsum.photos/200/200",
    tags: product.tagIds
      .map((tagId) => tagMap.get(tagId))
      .filter((name): name is string => !!name),
  }))

  const productStocks = await findAllProductStocks({
    dbClient,
    pagination: {
      offset: 0,
      limit: 1000,
    },
  })
  const totalProducts = productStocks.length
  const lowStockCount = productStocks.filter(
    (p) => p.stock <= 5 && p.stock > 0,
  ).length
  const outOfStockCount = productStocks.filter((p) => p.stock === 0).length
  // TODO: 削除する
  const totalValue = 0

  return {
    products: managementProducts,
    totalProducts,
    lowStockCount,
    outOfStockCount,
    totalValue,
    hasNextPage,
    currentPage: page,
    pageSize,
  }
}
