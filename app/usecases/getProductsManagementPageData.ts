import type Product from "../domain/product/entities/product"
import type ProductTag from "../domain/product/entities/productTag"
import { findAllProducts } from "../domain/product/repositories/productQueryRepository"
import { findAllProductTags } from "../domain/product/repositories/productTagQueryRepository"
import { dbClient } from "../infrastructure/db/client"

export type ProductsManagementPageData = {
  products: (Omit<Product, "image" | "tagIds"> & {
    image: string
    tags: string[]
  })[]
  tags: ProductTag[]
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
}

export const getProductsManagementPageData =
  async (): Promise<ProductsManagementPageData> => {
    const products = await findAllProducts({ dbClient })
    const tags = await findAllProductTags({ dbClient })
    const tagMap = new Map<number, string>(
      tags.map((tag) => [tag.id, tag.name]),
    )

    const managementProducts = products.map((product) => ({
      ...product,
      // TODO: デフォルト画像を正式なものに差し替える
      image: product.image ?? "https://picsum.photos/200/200",
      tags: product.tagIds
        .map((tagId) => tagMap.get(tagId))
        .filter((name): name is string => !!name),
    }))

    const totalProducts = products.length
    const lowStockCount = products.filter(
      (p) => p.stock <= 5 && p.stock > 0,
    ).length
    const outOfStockCount = products.filter((p) => p.stock === 0).length
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)

    return {
      products: managementProducts,
      tags,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalValue,
    }
  }
