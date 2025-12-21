import type { ProductImage } from "../../domain/product/entities"
import { productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { findProductImageByProductId } = productRepository

export type GetProductImageAsset = UsecaseFunction<
  { productImage: Pick<ProductImage, "productId"> },
  { productImage: ProductImage },
  "エラーが発生しました。" | "商品画像が見つかりません。"
>

export const getProductImageAssetData: GetProductImageAsset = async ({
  dbClient,
  productImage,
}) => {
  try {
    const foundProductImage = await findProductImageByProductId({
      dbClient,
      productImage,
    })
    if (!foundProductImage.ok) {
      if (foundProductImage.message === "商品画像が見つかりません。") {
        return { ok: false, message: "商品画像が見つかりません。" }
      }
      return { ok: false, message: "エラーが発生しました。" }
    }
    return { ok: true, value: { productImage: foundProductImage.value } }
  } catch {
    return { ok: false, message: "エラーが発生しました。" }
  }
}
