import {
  findAllProductTagsImpl,
  findProductTagByIdImpl,
} from "../../../infrastructure/product/productTagQueryRepositoryImpl"
import type { QueryRepositoryFunction, WithRepositoryImpl } from "../../types"
import type ProductTag from "../entities/productTag"

export type FindProductTagById = QueryRepositoryFunction<
  Pick<ProductTag, "id">,
  ProductTag | null
>
export type FindAllProductTags = QueryRepositoryFunction<
  Record<string, never>,
  ProductTag[]
>

export const findProductTagById: WithRepositoryImpl<
  FindProductTagById
> = async ({ id, repositoryImpl = findProductTagByIdImpl, dbClient }) => {
  return repositoryImpl({ id, dbClient })
}

export const findAllProductTags: WithRepositoryImpl<
  FindAllProductTags
> = async ({ repositoryImpl = findAllProductTagsImpl, dbClient }) => {
  return repositoryImpl({ dbClient })
}
