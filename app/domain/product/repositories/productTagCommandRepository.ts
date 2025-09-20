import { createProductTagImpl } from "../../../infrastructure/domain/product/productTagCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import type ProductTag from "../entities/productTag"

export type CreateProductTag = CommandRepositoryFunction<
  { productTag: Omit<ProductTag, "id"> },
  ProductTag
>

const validateProductTag = (tag: Omit<ProductTag, "id">) => {
  if (countStringLength(tag.name) < 1 || countStringLength(tag.name) > 50) {
    throw new Error("タグ名は1文字以上50文字以内である必要があります")
  }
}

export const createProductTag: WithRepositoryImpl<CreateProductTag> = async ({
  repositoryImpl = createProductTagImpl,
  dbClient,
  productTag,
}) => {
  validateProductTag(productTag)
  return repositoryImpl({ productTag, dbClient })
}
