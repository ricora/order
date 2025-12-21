import { MAX_TAGS_PER_PRODUCT } from "../../domain/product/constants"
import type { Product, ProductTag } from "../../domain/product/entities"
import { productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { findProductById, findAllProductTagsByIds } = productRepository

export type GetProductDeletePageData = UsecaseFunction<
  { product: Pick<Product, "id"> },
  {
    product:
      | (Pick<Product, "id" | "name" | "price" | "stock"> & {
          tags: ProductTag["name"][]
        })
      | null
  },
  "エラーが発生しました。" | "商品が見つかりません。"
>

export const getProductDeletePageData: GetProductDeletePageData = async ({
  dbClient,
  product,
}) => {
  try {
    const foundProductResult = await findProductById({ dbClient, product })
    if (!foundProductResult.ok) {
      if (foundProductResult.message === "商品が見つかりません。") {
        return { ok: false, message: "商品が見つかりません。" }
      }
      return { ok: false, message: "エラーが発生しました。" }
    }
    const foundProduct = foundProductResult.value
    const tagsResult = await findAllProductTagsByIds({
      dbClient,
      productTag: { ids: foundProduct.tagIds },
      pagination: { offset: 0, limit: MAX_TAGS_PER_PRODUCT },
    })
    if (!tagsResult.ok) return { ok: false, message: "エラーが発生しました。" }
    const tags = tagsResult.value

    return {
      ok: true,
      value: {
        product: {
          ...foundProduct,
          tags: tags.map((tag) => tag.name),
        },
      },
    }
  } catch {
    return { ok: false, message: "エラーが発生しました。" }
  }
}
