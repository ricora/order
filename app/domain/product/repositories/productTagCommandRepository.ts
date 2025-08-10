import { createProductTagImpl } from "../../../infrastructure/product/productTagCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { WithRepository } from "../../types"
import type ProductTag from "../entities/productTag"

export type CreateProductTag = (
  params: Omit<ProductTag, "id">,
) => Promise<ProductTag>

const validateProductTag = (tag: Omit<ProductTag, "id">) => {
  if (countStringLength(tag.name) < 1 || countStringLength(tag.name) > 50) {
    throw new Error("タグ名は1文字以上50文字以内である必要があります")
  }
}

export const createProductTag: WithRepository<CreateProductTag> = async ({
  repositoryImpl = createProductTagImpl,
  ...tag
}) => {
  validateProductTag(tag)
  return repositoryImpl({ ...tag })
}
