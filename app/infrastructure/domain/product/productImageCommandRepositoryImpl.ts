import { eq } from "drizzle-orm"
import type {
  CreateProductImage,
  DeleteProductImageByProductId,
  UpdateProductImageByProductId,
} from "../../../domain/product/repositories/productImageCommandRepository"
import { productImageTable } from "../../db/schema"

export const createProductImageImpl: CreateProductImage = async ({
  dbClient,
  productImage,
}) => {
  try {
    const result = await dbClient
      .insert(productImageTable)
      .values({
        productId: productImage.productId,
        data: productImage.data,
        mimeType: productImage.mimeType,
      })
      .returning()

    const created = result.at(0)
    if (!created) throw new Error("DBへの挿入に失敗しました")

    return {
      id: created.id,
      productId: created.productId,
      data: created.data,
      mimeType: created.mimeType,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    }
  } catch {
    throw new Error("画像の作成に失敗しました")
  }
}

export const updateProductImageByProductIdImpl: UpdateProductImageByProductId =
  async ({ dbClient, productImage }) => {
    try {
      const result = await dbClient
        .update(productImageTable)
        .set({
          data: productImage.data,
          mimeType: productImage.mimeType,
          updatedAt: new Date(),
        })
        .where(eq(productImageTable.productId, productImage.productId))
        .returning()

      const updated = result.at(0)
      if (!updated) throw new Error("DBの更新に失敗しました")

      return {
        id: updated.id,
        productId: updated.productId,
        data: updated.data,
        mimeType: updated.mimeType,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      }
    } catch {
      throw new Error("画像の更新に失敗しました")
    }
  }

export const deleteProductImageByProductIdImpl: DeleteProductImageByProductId =
  async ({ dbClient, productImage }) => {
    try {
      await dbClient
        .delete(productImageTable)
        .where(eq(productImageTable.productId, productImage.productId))
    } catch {
      throw new Error("画像の削除に失敗しました")
    }
  }
