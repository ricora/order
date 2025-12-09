import type { ProductImage } from "../../domain/product/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories-provider"

const { findProductImageByProductId } = productRepository

export type GetProductImageAssetParams = {
  dbClient: DbClient
  productImage: Pick<ProductImage, "productId">
}
export const getProductImageAssetData = async ({
  dbClient,
  productImage,
}: GetProductImageAssetParams): Promise<
  Result<
    { productImage: ProductImage },
    "エラーが発生しました。" | "商品画像が見つかりません。"
  >
> => {
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
