import type { Product } from "../../domain/product/entities"
import { productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { findProductById } = productRepository

export type GetProductEditPageData = UsecaseFunction<
  { product: Pick<Product, "id"> },
  { product: Product },
  "エラーが発生しました。" | "商品が見つかりません。"
>

export const getProductEditPageData: GetProductEditPageData = async ({
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
    return { ok: true, value: { product: foundProductResult.value } }
  } catch {
    return { ok: false, message: "エラーが発生しました。" }
  }
}
