import { MAX_STORE_PRODUCT_TAG_COUNT } from "../../domain/product/constants"
import type { ProductTag } from "../../domain/product/entities"
import { productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { findAllProductTags } = productRepository

export type GetProductRegistrationFormComponentData = UsecaseFunction<
  unknown,
  { tags: ProductTag[] },
  never
>

export const getProductRegistrationFormComponentData: GetProductRegistrationFormComponentData =
  async ({ dbClient }) => {
    try {
      const tagsResult = await findAllProductTags({
        dbClient,
        pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
      })
      if (!tagsResult.ok)
        return { ok: false, message: "エラーが発生しました。" }
      return { ok: true, value: { tags: tagsResult.value } }
    } catch {
      return { ok: false, message: "エラーが発生しました。" }
    }
  }
