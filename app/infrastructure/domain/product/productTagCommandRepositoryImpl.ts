import type ProductTag from "../../../domain/product/entities/productTag"
import type { CreateProductTag } from "../../../domain/product/repositories/productTagCommandRepository"
import { productTagTable } from "../../db/schema"

export const createProductTagImpl: CreateProductTag = async ({
  dbClient,
  productTag,
}) => {
  try {
    const dbProductTag = (
      await dbClient
        .insert(productTagTable)
        .values({ name: productTag.name })
        .returning()
    )[0]
    if (!dbProductTag) throw new Error("DBへの挿入に失敗しました")
    const newTag: ProductTag = {
      id: dbProductTag.id,
      name: dbProductTag.name,
    }
    return newTag
  } catch {
    throw new Error("商品タグの作成に失敗しました")
  }
}
