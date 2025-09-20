import {
  findAllProductsImpl,
  findProductByIdImpl,
} from "../../../infrastructure/domain/product/productQueryRepositoryImpl"
import type { QueryRepositoryFunction, WithRepositoryImpl } from "../../types"
import type Product from "../entities/product"
import { findAllProductTags } from "./productTagQueryRepository"

export type FindProductById = QueryRepositoryFunction<
  { product: Pick<Product, "id"> },
  Product | null
>
export type FindAllProducts = QueryRepositoryFunction<
  Record<string, never>,
  Product[]
>

export const findProductById: WithRepositoryImpl<FindProductById> = async ({
  product,
  repositoryImpl = findProductByIdImpl,
  dbClient,
}) => {
  const found = await repositoryImpl({ product, dbClient })
  if (!found) return null
  const tags = await findAllProductTags({ dbClient })
  const tagIdSet = new Set(tags.map((t) => t.id))
  return {
    ...found,
    tagIds: found.tagIds.filter((tagId) => tagIdSet.has(tagId)),
  }
}

export const findAllProducts: WithRepositoryImpl<FindAllProducts> = async ({
  repositoryImpl = findAllProductsImpl,
  dbClient,
}) => {
  const products = await repositoryImpl({ dbClient })
  const tags = await findAllProductTags({ dbClient })
  const tagIdSet = new Set(tags.map((t) => t.id))
  return products.map((product) => ({
    ...product,
    tagIds: product.tagIds.filter((tagId) => tagIdSet.has(tagId)),
  }))
}
