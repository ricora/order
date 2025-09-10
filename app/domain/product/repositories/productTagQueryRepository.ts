import {
  findAllProductTagsImpl,
  findProductTagByIdImpl,
} from "../../../infrastructure/product/productTagQueryRepositoryImpl"
import type { QueryRepositoryFunction, WithRepositoryImpl } from "../../types"
import type ProductTag from "../entities/productTag"

export type FindProductTagById = QueryRepositoryFunction<
  { productTag: Pick<ProductTag, "id"> },
  ProductTag | null
>
export type FindAllProductTags = QueryRepositoryFunction<
  Record<string, never>,
  ProductTag[]
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
> = async ({ repositoryImpl = findAllProductTagsImpl, dbClient }) => {
  return repositoryImpl({ dbClient })
}
