import { MAX_STORE_PRODUCT_COUNT } from "../domain/product/constants"
import type Product from "../domain/product/entities/product"
import {
  findAllProductStocks,
  findAllProductsOrderByIdAsc,
  findAllProductsOrderByIdDesc,
} from "../domain/product/repositories/productQueryRepository"
import { findAllProductTagsByIds } from "../domain/product/repositories/productTagQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

type ProductStatus = "inStock" | "lowStock" | "outOfStock"

export const LOW_STOCK_THRESHOLD = 5

export type GetProductsManagementPageDataParams = {
  dbClient: DbClient
  page?: number
  sort?: "asc" | "desc"
}

export type ProductsManagementPageData = {
  products: (Omit<Product, "image" | "tagIds"> & {
    tags: string[]
    status: ProductStatus
  })[]
  totalProducts: number
  inStockCount: number
  lowStockCount: number
  outOfStockCount: number
  hasNextPage: boolean
  currentPage: number
  pageSize: number
}

const calculateProductStatus = (stock: number): ProductStatus => {
  if (stock > LOW_STOCK_THRESHOLD) {
    return "inStock"
  }
  if (stock > 0) {
    return "lowStock"
  }
  return "outOfStock"
}

export const getProductsManagementPageData = async ({
  dbClient,
  page = 1,
  sort = "asc",
}: GetProductsManagementPageDataParams): Promise<ProductsManagementPageData> => {
  const pageSize = 20
  const offset = Math.max(0, (page - 1) * pageSize)

  const productsWithExtra = await (sort === "asc"
    ? findAllProductsOrderByIdAsc
    : findAllProductsOrderByIdDesc)({
    dbClient,
    pagination: { offset, limit: pageSize + 1 },
  })
  const hasNextPage = productsWithExtra.length > pageSize
  const products = productsWithExtra.slice(0, pageSize)

  const tags = await findAllProductTagsByIds({
    dbClient,
    pagination: {
      offset: 0,
      limit: MAX_STORE_PRODUCT_COUNT,
    },
    productTag: { ids: products.flatMap((p) => p.tagIds) },
  })
  const tagMap = new Map<number, string>(tags.map((tag) => [tag.id, tag.name]))

  const managementProducts = products.map((product) => {
    const status = calculateProductStatus(product.stock)
    return {
      ...product,
      tags: product.tagIds
        .map((tagId) => tagMap.get(tagId))
        .filter((name): name is string => !!name),
      status,
    }
  })

  const productStocks = await findAllProductStocks({
    dbClient,
    pagination: {
      offset: 0,
      limit: MAX_STORE_PRODUCT_COUNT,
    },
  })
  const totalProducts = productStocks.length
  const inStockCount = productStocks.filter(
    (p) => p.stock > LOW_STOCK_THRESHOLD,
  ).length
  const lowStockCount = productStocks.filter(
    (p) => p.stock <= LOW_STOCK_THRESHOLD && p.stock > 0,
  ).length
  const outOfStockCount = productStocks.filter((p) => p.stock === 0).length

  return {
    products: managementProducts,
    totalProducts,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    hasNextPage,
    currentPage: page,
    pageSize,
  }
}
