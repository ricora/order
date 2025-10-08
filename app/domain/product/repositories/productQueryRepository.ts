import {
  findAllProductsImpl,
  findProductByIdImpl,
  findProductByNameImpl,
} from "../../../infrastructure/domain/product/productQueryRepositoryImpl"
import type { QueryRepositoryFunction, WithRepositoryImpl } from "../../types"
import type Product from "../entities/product"

export type FindProductById = QueryRepositoryFunction<
  { product: Pick<Product, "id"> },
  Product | null
>
export type FindProductByName = QueryRepositoryFunction<
  { product: Pick<Product, "name"> },
  Product | null
>
export type FindAllProducts = QueryRepositoryFunction<
  Record<string, never>,
  Product[]
>
export type findAllProductsByIds = QueryRepositoryFunction<
  { product: { ids: Product["id"][] } },
  Product[]
>

export const findProductById: WithRepositoryImpl<FindProductById> = async ({
  product,
  repositoryImpl = findProductByIdImpl,
  dbClient,
}) => {
  return repositoryImpl({ product, dbClient })
}

export const findProductByName: WithRepositoryImpl<FindProductByName> = async ({
  product,
  repositoryImpl = findProductByNameImpl,
  dbClient,
}) => {
  return repositoryImpl({ product, dbClient })
}

export const findAllProducts: WithRepositoryImpl<FindAllProducts> = async ({
  repositoryImpl = findAllProductsImpl,
  dbClient,
}) => {
  return repositoryImpl({ dbClient })
}

export const findAllProductsByIds: WithRepositoryImpl<
  findAllProductsByIds
> = async ({ product, repositoryImpl = findAllProductsImpl, dbClient }) => {
  return repositoryImpl({ dbClient, product })
}
