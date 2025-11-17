import {
  countProductTagsImpl,
  findAllProductTagRelationCountsByTagIdsImpl,
  findAllProductTagsByIdsImpl,
  findAllProductTagsImpl,
  findProductTagByIdImpl,
} from "../../../infrastructure/domain/product/productTagQueryRepositoryImpl"
import type {
  PaginatedQueryRepositoryFunction,
  QueryRepositoryFunction,
  WithRepositoryImpl,
} from "../../types"
import type ProductTag from "../entities/productTag"

export type FindProductTagById = QueryRepositoryFunction<
  { productTag: Pick<ProductTag, "id"> },
  ProductTag | null
>

export type FindAllProductTags = PaginatedQueryRepositoryFunction<
  Record<string, never>,
  ProductTag
>

export type FindAllProductTagsByIds = PaginatedQueryRepositoryFunction<
  { productTag: { ids: ProductTag["id"][] } },
  ProductTag
>

export type CountProductTags = QueryRepositoryFunction<
  Record<string, never>,
  number
>

export type FindAllProductTagRelationCountsByTagIds =
  PaginatedQueryRepositoryFunction<
    { productTag: { ids: ProductTag["id"][] } },
    { tagId: ProductTag["id"]; count: number }
  >

export const findProductTagById: WithRepositoryImpl<
  FindProductTagById
> = async ({
  productTag,
  repositoryImpl = findProductTagByIdImpl,
  dbClient,
}) => {
  return repositoryImpl({ productTag, dbClient })
}

export const findAllProductTags: WithRepositoryImpl<
  FindAllProductTags
> = async ({
  repositoryImpl = findAllProductTagsImpl,
  dbClient,
  pagination,
}) => {
  return repositoryImpl({ dbClient, pagination })
}

export const findAllProductTagsByIds: WithRepositoryImpl<
  FindAllProductTagsByIds
> = async ({
  repositoryImpl = findAllProductTagsByIdsImpl,
  dbClient,
  pagination,
  productTag,
}) => {
  return repositoryImpl({ dbClient, pagination, productTag })
}

export const countProductTags: WithRepositoryImpl<CountProductTags> = async ({
  repositoryImpl = countProductTagsImpl,
  dbClient,
}) => {
  return repositoryImpl({ dbClient })
}

export const findAllProductTagRelationCountsByTagIds: WithRepositoryImpl<
  FindAllProductTagRelationCountsByTagIds
> = async ({
  repositoryImpl = findAllProductTagRelationCountsByTagIdsImpl,
  dbClient,
  pagination,
  productTag,
}) => {
  return repositoryImpl({ dbClient, pagination, productTag })
}
