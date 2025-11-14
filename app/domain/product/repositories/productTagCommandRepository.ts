import type { TransactionDbClient } from "../../../infrastructure/db/client"
import { createProductTagImpl } from "../../../infrastructure/domain/product/productTagCommandRepositoryImpl"
import { countStringLength } from "../../../utils/text"
import type { CommandRepositoryFunction, WithRepositoryImpl } from "../../types"
import { MAX_STORE_PRODUCT_TAG_COUNT } from "../constants"
import type ProductTag from "../entities/productTag"
import { countProductTags } from "./productTagQueryRepository"

export type CreateProductTag = CommandRepositoryFunction<
  { productTag: Omit<ProductTag, "id"> },
  ProductTag
>

const validateProductTag = (tag: Omit<ProductTag, "id">) => {
  if (countStringLength(tag.name) < 1 || countStringLength(tag.name) > 50) {
    throw new Error("タグ名は1文字以上50文字以内である必要があります")
  }
}

const verifyProductTagCountLimit = async (dbClient: TransactionDbClient) => {
  const totalTags = await countProductTags({ dbClient })
  if (totalTags >= MAX_STORE_PRODUCT_TAG_COUNT) {
    throw new Error(
      `1店舗あたりの商品タグは${MAX_STORE_PRODUCT_TAG_COUNT}個までです`,
    )
  }
}

export const createProductTag: WithRepositoryImpl<CreateProductTag> = async ({
  repositoryImpl = createProductTagImpl,
  dbClient,
  productTag,
}) => {
  validateProductTag(productTag)
  await verifyProductTagCountLimit(dbClient)
  return repositoryImpl({ productTag, dbClient })
}
