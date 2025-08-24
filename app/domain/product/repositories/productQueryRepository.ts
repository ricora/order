import {
  findAllProductsImpl,
  findProductByIdImpl,
} from "../../../infrastructure/product/productQueryRepositoryImpl"
import type { QueryRepositoryFunction, WithRepositoryImpl } from "../../types"
import type Product from "../entities/product"
import { findAllProductTags } from "./productTagQueryRepository"

export type FindProductById = QueryRepositoryFunction<
  Pick<Product, "id">,
  Product | null
>
export type FindAllProducts = QueryRepositoryFunction<
  Record<string, never>,
  Product[]
>

export const findProductById: WithRepositoryImpl<FindProductById> = async ({
  id,
  repositoryImpl = findProductByIdImpl,
  dbClient,
}) => {
  const product = await repositoryImpl({ id, dbClient })
  if (!product) return null
  const tags = await findAllProductTags({ dbClient })
  const tagIdSet = new Set(tags.map((t) => t.id))
  return {
    ...product,
    tagIds: product.tagIds.filter((tagId) => tagIdSet.has(tagId)),
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
