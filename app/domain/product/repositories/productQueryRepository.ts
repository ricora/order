import {
  findAllProductsImpl,
  findProductByIdImpl,
} from "../../../infrastructure/product/productQueryRepositoryImpl"
import type { WithRepositoryImpl } from "../../types"
import type Product from "../entities/product"
import { findAllProductTags } from "./productTagQueryRepository"

export type FindProductById = (
  params: Pick<Product, "id">,
) => Promise<Product | null>
export type FindAllProducts = () => Promise<Product[]>

export const findProductById: WithRepositoryImpl<FindProductById> = async ({
  id,
  repositoryImpl = findProductByIdImpl,
}) => {
  const product = await repositoryImpl({ id })
  if (!product) return null
  const tags = await findAllProductTags({})
  const tagIdSet = new Set(tags.map((t) => t.id))
  return {
    ...product,
    tagIds: product.tagIds.filter((tagId) => tagIdSet.has(tagId)),
  }
}

export const findAllProducts: WithRepositoryImpl<FindAllProducts> = async ({
  repositoryImpl = findAllProductsImpl,
}) => {
  const products = await repositoryImpl()
  const tags = await findAllProductTags({})
  const tagIdSet = new Set(tags.map((t) => t.id))
  return products.map((product) => ({
    ...product,
    tagIds: product.tagIds.filter((tagId) => tagIdSet.has(tagId)),
  }))
}
