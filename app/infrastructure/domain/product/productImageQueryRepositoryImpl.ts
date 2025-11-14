import { eq } from "drizzle-orm"
import type { FindProductImageByProductId } from "../../../domain/product/repositories/productImageQueryRepository"
import { productImageTable } from "../../db/schema"

export const findProductImageByProductIdImpl: FindProductImageByProductId =
  async ({ dbClient, productImage }) => {
    const dbProductImage = await dbClient.query.productImageTable.findFirst({
      where: eq(productImageTable.productId, productImage.productId),
    })

    return dbProductImage
      ? {
          id: dbProductImage.id,
          productId: dbProductImage.productId,
          data: dbProductImage.data,
          mimeType: dbProductImage.mimeType,
          createdAt: dbProductImage.createdAt,
          updatedAt: dbProductImage.updatedAt,
        }
      : null
  }
