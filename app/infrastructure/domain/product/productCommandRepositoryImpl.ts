import { eq } from "drizzle-orm"
import type {
  CreateProduct,
  DeleteProduct,
  UpdateProduct,
} from "../../../domain/product/repositories/productCommandRepository"
import {
  productImageTable,
  productTable,
  productTagRelationTable,
} from "../../db/schema"

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

    if (!product.image) {
      return {
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: product.tagIds,
        price: dbProduct.price,
        stock: dbProduct.stock,
        image: null,
      }
    }

    const dbImage = (
      await dbClient
        .insert(productImageTable)
        .values({
          productId: dbProduct.id,
          data: product.image.data,
          mimeType: product.image.mimeType,
        })
        .returning()
    )[0]
    if (!dbImage) throw new Error("DBへの挿入に失敗しました")

    return {
      id: dbProduct.id,
      name: dbProduct.name,
      tagIds: product.tagIds,
      price: dbProduct.price,
      stock: dbProduct.stock,
      image:
        dbImage.data && dbImage.mimeType
          ? {
              data: dbImage.data,
              mimeType: dbImage.mimeType,
            }
          : null,
    }
  } catch {
    throw new Error("商品の作成に失敗しました")
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
          price: product.price,
          stock: product.stock,
        })
        .where(eq(productTable.id, product.id))
        .returning()
    )[0]
    if (!dbProduct) throw new Error("DBの更新に失敗しました")

    const updatedTagIds = await ("tagIds" in product
      ? (async () => {
          await dbClient
            .delete(productTagRelationTable)
            .where(eq(productTagRelationTable.productId, product.id))

          if (!product.tagIds || product.tagIds.length === 0) {
            return []
          }

          const rows = product.tagIds.map((tagId) => ({
            productId: product.id,
            tagId,
          }))
          const relations = await dbClient
            .insert(productTagRelationTable)
            .values(rows)
            .returning()
          return relations.map((relation) => relation.tagId)
        })()
      : (async () => {
          const existingRelations = await dbClient
            .select()
            .from(productTagRelationTable)
            .where(eq(productTagRelationTable.productId, product.id))
          return existingRelations.map((relation) => relation.tagId)
        })())

    let image: NonNullable<Awaited<ReturnType<UpdateProduct>>>["image"] = null
    if (product.image === undefined) {
      const dbImage = await dbClient.query.productImageTable.findFirst({
        where: eq(productImageTable.productId, product.id),
      })
      image =
        dbImage?.data && dbImage.mimeType
          ? { data: dbImage.data, mimeType: dbImage.mimeType }
          : null
    } else if (product.image === null) {
      await dbClient
        .delete(productImageTable)
        .where(eq(productImageTable.productId, product.id))
      image = null
    } else {
      const existingImage = await dbClient.query.productImageTable.findFirst({
        where: eq(productImageTable.productId, product.id),
      })

      if (existingImage) {
        const dbImage = (
          await dbClient
            .update(productImageTable)
            .set({
              data: product.image.data,
              mimeType: product.image.mimeType,
            })
            .where(eq(productImageTable.productId, product.id))
            .returning()
        )[0]
        image =
          dbImage?.data && dbImage.mimeType
            ? { data: dbImage.data, mimeType: dbImage.mimeType }
            : null
      } else {
        const dbImage = (
          await dbClient
            .insert(productImageTable)
            .values({
              productId: product.id,
              data: product.image.data,
              mimeType: product.image.mimeType,
            })
            .returning()
        )[0]
        image =
          dbImage?.data && dbImage.mimeType
            ? { data: dbImage.data, mimeType: dbImage.mimeType }
            : null
      }
    }

    return {
      id: dbProduct.id,
      name: dbProduct.name,
      tagIds: updatedTagIds,
      price: dbProduct.price,
      stock: dbProduct.stock,
      image: image,
    }
  } catch {
    throw new Error("商品の更新に失敗しました")
  }
}

export const deleteProductImpl: DeleteProduct = async ({
  dbClient,
  product,
}) => {
  try {
    await dbClient.delete(productTable).where(eq(productTable.id, product.id))
  } catch {
    throw new Error("商品の削除に失敗しました")
  }
}
