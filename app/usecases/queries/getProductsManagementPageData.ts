import { MAX_STORE_PRODUCT_COUNT } from "../../domain/product/constants"
import type { Product } from "../../domain/product/entities"
import { productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const {
  findAllProductStocks,
  findAllProductsOrderByIdAsc,
  findAllProductsOrderByIdDesc,
  findAllProductTagsByIds,
} = productRepository

type ProductStatus = "inStock" | "lowStock" | "outOfStock"

export const LOW_STOCK_THRESHOLD = 5

export type GetProductsManagementPageData = UsecaseFunction<
  { page?: number; sort?: "asc" | "desc" },
  {
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
  },
  "エラーが発生しました。"
>
const calculateProductStatus = (stock: number): ProductStatus => {
  if (stock > LOW_STOCK_THRESHOLD) {
    return "inStock"
  }
  if (stock > 0) {
    return "lowStock"
  }
  return "outOfStock"
}

export const getProductsManagementPageData: GetProductsManagementPageData =
  async ({ dbClient, page = 1, sort = "asc" }) => {
    const pageSize = 50
    const offset = Math.max(0, (page - 1) * pageSize)

    try {
      const productsWithExtraResult = await (sort === "asc"
        ? findAllProductsOrderByIdAsc
        : findAllProductsOrderByIdDesc)({
        dbClient,
        pagination: { offset, limit: pageSize + 1 },
      })
      if (!productsWithExtraResult.ok) {
        return { ok: false, message: "エラーが発生しました。" }
      }
      const productsWithExtra = productsWithExtraResult.value
      const hasNextPage = productsWithExtra.length > pageSize
      const products = productsWithExtra.slice(0, pageSize)

      const tagsResult = await findAllProductTagsByIds({
        dbClient,
        pagination: {
          offset: 0,
          limit: MAX_STORE_PRODUCT_COUNT,
        },
        productTag: { ids: products.flatMap((p) => p.tagIds) },
      })
      if (!tagsResult.ok) {
        return { ok: false, message: "エラーが発生しました。" }
      }
      const tags = tagsResult.value
      const tagMap = new Map<number, string>(
        tags.map((tag) => [tag.id, tag.name]),
      )

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

      const productStocksResult = await findAllProductStocks({
        dbClient,
        pagination: {
          offset: 0,
          limit: MAX_STORE_PRODUCT_COUNT,
        },
      })
      if (!productStocksResult.ok) {
        return { ok: false, message: "エラーが発生しました。" }
      }
      const productStocks = productStocksResult.value
      const totalProducts = productStocks.length
      const inStockCount = productStocks.filter(
        (p) => p.stock > LOW_STOCK_THRESHOLD,
      ).length
      const lowStockCount = productStocks.filter(
        (p) => p.stock <= LOW_STOCK_THRESHOLD && p.stock > 0,
      ).length
      const outOfStockCount = productStocks.filter((p) => p.stock === 0).length

      return {
        ok: true,
        value: {
          products: managementProducts,
          totalProducts,
          inStockCount,
          lowStockCount,
          outOfStockCount,
          hasNextPage,
          currentPage: page,
          pageSize,
        },
      }
    } catch {
      return { ok: false, message: "エラーが発生しました。" }
    }
  }
