import {
  findAllProductTagsImpl,
  findProductTagByIdImpl,
} from "../../../infrastructure/product/productTagQueryRepositoryImpl"
import type { WithRepository } from "../../types"
import type ProductTag from "../entities/productTag"

export type FindProductTagById = (
  params: Pick<ProductTag, "id">,
) => Promise<ProductTag | null>
export type FindAllProductTags = () => Promise<ProductTag[]>

export const findProductTagById: WithRepository<FindProductTagById> = async ({
  id,
  repositoryImpl = findProductTagByIdImpl,
}) => {
  return repositoryImpl({ id })
}

export const findAllProductTags: WithRepository<FindAllProductTags> = async ({
  repositoryImpl = findAllProductTagsImpl,
}) => {
  return repositoryImpl()
}
