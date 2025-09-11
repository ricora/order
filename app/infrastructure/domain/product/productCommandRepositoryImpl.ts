import { eq } from "drizzle-orm"
import type Product from "../../../domain/product/entities/product"
import type {
  CreateProduct,
  DeleteProduct,
  UpdateProduct,
} from "../../../domain/product/repositories/productCommandRepository"
import { productTable, productTagRelationTable } from "../../db/schema"

export const createProductImpl: CreateProduct = async ({
  dbClient,
  product,
}) => {
  try {
    const dbProduct = (
      await dbClient
        .insert(productTable)
        .values({
          name: product.name,
          image: product.image,
          price: product.price,
          stock: product.stock,
        })
        .returning()
    )[0]
    if (!dbProduct) throw new Error("DBへの挿入に失敗しました")

    if (product.tagIds && product.tagIds.length > 0) {
      const rows = product.tagIds.map((tagId) => ({
        productId: dbProduct.id,
        tagId,
      }))
      await dbClient.insert(productTagRelationTable).values(rows)
    }

    const newProduct: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      image: dbProduct.image,
      tagIds: product.tagIds,
      price: dbProduct.price,
      stock: dbProduct.stock,
    }
    return Promise.resolve(newProduct)
  } catch {
    return Promise.reject(new Error("商品の作成に失敗しました"))
  }
}

export const updateProductImpl: UpdateProduct = async ({
  dbClient,
  product,
}) => {
  try {
    const dbProduct = (
      await dbClient
        .update(productTable)
        .set({
          name: product.name,
          image: product.image,
          price: product.price,
          stock: product.stock,
        })
        .where(eq(productTable.id, product.id))
        .returning()
    )[0]
    if (!dbProduct) throw new Error("DBの更新に失敗しました")

    await dbClient
      .delete(productTagRelationTable)
      .where(eq(productTagRelationTable.productId, product.id))
    let dbProductTagRelations: (typeof productTagRelationTable.$inferSelect)[] =
      []
    if (product.tagIds.length > 0) {
      const rows = product.tagIds.map((tagId) => ({
        productId: product.id,
        tagId,
      }))
      dbProductTagRelations = await dbClient
        .insert(productTagRelationTable)
        .values(rows)
        .returning()
    }

    const updatedProduct: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      image: dbProduct.image,
      tagIds: dbProductTagRelations.map((relation) => relation.tagId),
      price: dbProduct.price,
      stock: dbProduct.stock,
    }
    return Promise.resolve(updatedProduct)
  } catch {
    return Promise.reject(new Error("商品の更新に失敗しました"))
  }
}

export const deleteProductImpl: DeleteProduct = async ({
  dbClient,
  product,
}) => {
  try {
    await dbClient.delete(productTable).where(eq(productTable.id, product.id))
    return Promise.resolve()
  } catch {
    return Promise.reject(new Error("商品の削除に失敗しました"))
  }
}
