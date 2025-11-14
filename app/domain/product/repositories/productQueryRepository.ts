import {
  countProductsImpl,
  findAllProductStocksImpl,
  findAllProductsByIdsImpl,
  findAllProductsImpl,
  findProductByIdImpl,
  findProductByNameImpl,
} from "../../../infrastructure/domain/product/productQueryRepositoryImpl"
import type {
  PaginatedQueryRepositoryFunction,
  QueryRepositoryFunction,
  WithRepositoryImpl,
} from "../../types"
import type Product from "../entities/product"

export type FindProductById = QueryRepositoryFunction<
  { product: Pick<Product, "id"> },
  Product | null
>
export type FindProductByName = QueryRepositoryFunction<
  { product: Pick<Product, "name"> },
  Product | null
>
export type FindAllProducts = PaginatedQueryRepositoryFunction<
  Record<string, never>,
  Product
>
export type FindAllProductStocks = PaginatedQueryRepositoryFunction<
  Record<string, never>,
  Pick<Product, "stock">
>
export type FindAllProductsByIds = PaginatedQueryRepositoryFunction<
  { product: { ids: Product["id"][] } },
  Product
>

export type CountProducts = QueryRepositoryFunction<
  Record<string, never>,
  number
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
  pagination,
}) => {
  return repositoryImpl({ dbClient, pagination })
}

export const findAllProductStocks: WithRepositoryImpl<
  FindAllProductStocks
> = async ({
  repositoryImpl = findAllProductStocksImpl,
  dbClient,
  pagination,
}) => {
  return repositoryImpl({ dbClient, pagination })
}

export const findAllProductsByIds: WithRepositoryImpl<
  FindAllProductsByIds
> = async ({
  product,
  repositoryImpl = findAllProductsByIdsImpl,
  dbClient,
  pagination,
}) => {
  return repositoryImpl({ dbClient, product, pagination })
}

export const countProducts: WithRepositoryImpl<CountProducts> = async ({
  repositoryImpl = countProductsImpl,
  dbClient,
}) => {
  return repositoryImpl({ dbClient })
}
