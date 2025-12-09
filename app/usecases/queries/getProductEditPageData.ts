import type { Product } from "../../domain/product/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories-provider"

const { findProductById } = productRepository

export type GetProductEditPageDataParams = {
  dbClient: DbClient
  product: Pick<Product, "id">
}

export type ProductEditPageData = {
  product: Product
}

export const getProductEditPageData = async ({
  dbClient,
  product,
}: GetProductEditPageDataParams): Promise<
  Result<
    ProductEditPageData,
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
    return { ok: true, value: { product: foundProductResult.value } }
  } catch {
    return { ok: false, message: "エラーが発生しました。" }
  }
}
