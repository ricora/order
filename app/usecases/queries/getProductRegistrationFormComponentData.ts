import { MAX_STORE_PRODUCT_TAG_COUNT } from "../../domain/product/constants"
import type { ProductTag } from "../../domain/product/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories-provider"

const { findAllProductTags } = productRepository

export type GetProductRegistrationFormComponentDataParams = {
  dbClient: DbClient
}

export type ProductRegistrationFormComponentData = {
  tags: ProductTag[]
}

export const getProductRegistrationFormComponentData = async ({
  dbClient,
}: GetProductRegistrationFormComponentDataParams): Promise<
  Result<ProductRegistrationFormComponentData, "エラーが発生しました。">
> => {
  try {
    const tagsResult = await findAllProductTags({
      dbClient,
      pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
    })
    if (!tagsResult.ok) return { ok: false, message: "エラーが発生しました。" }
    return { ok: true, value: { tags: tagsResult.value } }
  } catch {
    return { ok: false, message: "エラーが発生しました。" }
  }
}
