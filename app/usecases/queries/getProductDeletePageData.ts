import { MAX_TAGS_PER_PRODUCT } from "../../domain/product/constants"
import type Product from "../../domain/product/entities/product"
import type ProductTag from "../../domain/product/entities/productTag"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories-provider"

const { findProductById, findAllProductTagsByIds } = productRepository

export type GetProductDeletePageDataParams = {
  dbClient: DbClient
  product: Pick<Product, "id">
}

export type ProductDeletePageData = {
  product:
    | (Pick<Product, "id" | "name" | "price" | "stock"> & {
        tags: ProductTag["name"][]
      })
    | null
}

export const getProductDeletePageData = async ({
  dbClient,
  product,
}: GetProductDeletePageDataParams): Promise<
  Result<
    ProductDeletePageData,
    "エラーが発生しました。" | "商品が見つかりません。"
  >
> => {
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
