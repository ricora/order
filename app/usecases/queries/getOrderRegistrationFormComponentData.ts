import {
  MAX_STORE_PRODUCT_COUNT,
  MAX_STORE_PRODUCT_TAG_COUNT,
} from "../../domain/product/constants"
import type { Product, ProductTag } from "../../domain/product/entities"
import { productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { findAllProductsOrderByIdAsc, findAllProductTags } = productRepository

export type OrderRegistrationFormComponentData = {
  products: (Omit<Product, "image" | "tagIds"> & { tags: string[] })[]
  tags: ProductTag[]
}

export type GetOrderRegistrationFormComponentData = UsecaseFunction<
  unknown,
  OrderRegistrationFormComponentData,
  never
>

export const getOrderRegistrationFormComponentData: GetOrderRegistrationFormComponentData =
  async ({ dbClient }) => {
    try {
      const productsResult = await findAllProductsOrderByIdAsc({
        dbClient,
        pagination: { offset: 0, limit: MAX_STORE_PRODUCT_COUNT },
      })
      if (!productsResult.ok)
        return { ok: false, message: "エラーが発生しました。" }
      const products = productsResult.value

      const tagsResult = await findAllProductTags({
        dbClient,
        pagination: { offset: 0, limit: MAX_STORE_PRODUCT_TAG_COUNT },
      })
      if (!tagsResult.ok)
        return { ok: false, message: "エラーが発生しました。" }
      const tags = tagsResult.value
      const tagMap = new Map<number, string>(
        tags.map((tag) => [tag.id, tag.name]),
      )

      return {
        ok: true,
        value: {
          products: products.map((product) => ({
            ...product,
            tags: product.tagIds
              .map((tagId) => tagMap.get(tagId))
              .filter((name): name is string => !!name),
          })),
          tags,
        },
      }
    } catch {
      return { ok: false, message: "エラーが発生しました。" }
    }
  }
