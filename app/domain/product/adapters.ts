import { asc, count, desc, eq, inArray } from "drizzle-orm"
import {
  productImageTable,
  productTable,
  productTagRelationTable,
  productTagTable,
} from "../../libs/db/schema"
import type ProductTag from "./entities/productTag"
import type { Repositories } from "./repositories"

export const adapters = {
  findProductById: async ({ dbClient, product }) => {
    const dbProduct = await dbClient.query.productTable.findFirst({
      where: eq(productTable.id, product.id),
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
    })
    if (!dbProduct) return null

    return {
      id: dbProduct.id,
      name: dbProduct.name,
      tagIds: dbProduct.productTags.map((tag) => tag.tagId),
      price: dbProduct.price,
      stock: dbProduct.stock,
    }
  },

  findProductByName: async ({ dbClient, product }) => {
    const dbProduct = await dbClient.query.productTable.findFirst({
      where: eq(productTable.name, product.name),
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
    })
    if (!dbProduct) return null

    return {
      id: dbProduct.id,
      name: dbProduct.name,
      tagIds: dbProduct.productTags.map((tag) => tag.tagId),
      price: dbProduct.price,
      stock: dbProduct.stock,
    }
  },

  findAllProductsOrderByIdAsc: async ({ dbClient, pagination }) => {
    const dbProducts = await dbClient.query.productTable.findMany({
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
      orderBy: [asc(productTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return dbProducts.map((dbProduct) => ({
      id: dbProduct.id,
      name: dbProduct.name,
      tagIds: dbProduct.productTags.map((tag) => tag.tagId),
      price: dbProduct.price,
      stock: dbProduct.stock,
    }))
  },

  findAllProductsOrderByIdDesc: async ({ dbClient, pagination }) => {
    const dbProducts = await dbClient.query.productTable.findMany({
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
      orderBy: [desc(productTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return dbProducts.map((dbProduct) => ({
      id: dbProduct.id,
      name: dbProduct.name,
      tagIds: dbProduct.productTags.map((tag) => tag.tagId),
      price: dbProduct.price,
      stock: dbProduct.stock,
    }))
  },

  findAllProductStocks: async ({ dbClient, pagination }) => {
    const dbProducts = await dbClient.query.productTable.findMany({
      columns: {
        stock: true,
      },
      orderBy: [asc(productTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return dbProducts.map((dbProduct) => ({
      stock: dbProduct.stock,
    }))
  },

  findAllProductsByIds: async ({ dbClient, product, pagination }) => {
    const dbProducts = await dbClient.query.productTable.findMany({
      where: inArray(productTable.id, product.ids),
      with: {
        productTags: {
          columns: {
            tagId: true,
          },
        },
      },
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return dbProducts.map((dbProduct) => ({
      id: dbProduct.id,
      name: dbProduct.name,
      tagIds: dbProduct.productTags.map((tag) => tag.tagId),
      price: dbProduct.price,
      stock: dbProduct.stock,
    }))
  },

  countProducts: async ({ dbClient }) => {
    return await dbClient.$count(productTable)
  },

  findProductTagById: async ({ dbClient, productTag }) => {
    const dbProductTag = await dbClient.query.productTagTable.findFirst({
      where: eq(productTagTable.id, productTag.id),
    })
    if (!dbProductTag) return null

    return { id: dbProductTag.id, name: dbProductTag.name }
  },

  findAllProductTags: async ({ dbClient, pagination }) => {
    const dbProductTags = await dbClient.query.productTagTable.findMany({
      orderBy: [asc(productTagTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return dbProductTags.map((dbProductTag) => ({
      id: dbProductTag.id,
      name: dbProductTag.name,
    }))
  },

  findAllProductTagsByIds: async ({ dbClient, productTag, pagination }) => {
    const dbProductTags = await dbClient.query.productTagTable.findMany({
      where: inArray(productTagTable.id, productTag.ids),
      orderBy: [asc(productTagTable.id)],
      offset: pagination.offset,
      limit: pagination.limit,
    })
    return dbProductTags.map((dbProductTag) => ({
      id: dbProductTag.id,
      name: dbProductTag.name,
    }))
  },

  countProductTags: async ({ dbClient }) => {
    return await dbClient.$count(productTagTable)
  },

  findAllProductTagRelationCountsByTagIds: async ({
    dbClient,
    productTag,
    pagination,
  }) => {
    const results = await dbClient
      .select({
        tagId: productTagRelationTable.tagId,
        count: count(),
      })
      .from(productTagRelationTable)
      .where(inArray(productTagRelationTable.tagId, productTag.ids))
      .groupBy(productTagRelationTable.tagId)
      .offset(pagination.offset)
      .limit(pagination.limit)

    return results.map((result) => ({
      tagId: result.tagId,
      count: result.count,
    }))
  },

  findProductImageByProductId: async ({ dbClient, productImage }) => {
    const dbProductImage = await dbClient.query.productImageTable.findFirst({
      where: eq(productImageTable.productId, productImage.productId),
    })
    if (!dbProductImage) return null

    return {
      id: dbProductImage.id,
      productId: dbProductImage.productId,
      data: dbProductImage.data,
      mimeType: dbProductImage.mimeType,
      createdAt: dbProductImage.createdAt,
      updatedAt: dbProductImage.updatedAt,
    }
  },

  createProduct: async ({ dbClient, product }) => {
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

      return {
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: product.tagIds,
        price: dbProduct.price,
        stock: dbProduct.stock,
      }
    } catch {
      throw new Error("商品の作成に失敗しました")
    }
  },

  updateProduct: async ({ dbClient, product }) => {
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

      return {
        id: dbProduct.id,
        name: dbProduct.name,
        tagIds: updatedTagIds,
        price: dbProduct.price,
        stock: dbProduct.stock,
      }
    } catch {
      throw new Error("商品の更新に失敗しました")
    }
  },

  deleteProduct: async ({ dbClient, product }) => {
    try {
      await dbClient.delete(productTable).where(eq(productTable.id, product.id))
      await dbClient
        .delete(productTagRelationTable)
        .where(eq(productTagRelationTable.productId, product.id))
    } catch {
      throw new Error("商品の削除に失敗しました")
    }
  },

  createProductTag: async ({ dbClient, productTag }) => {
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
  },

  deleteAllProductTagsByIds: async ({ dbClient, productTag }) => {
    try {
      await dbClient
        .delete(productTagTable)
        .where(inArray(productTagTable.id, productTag.ids))
      await dbClient
        .delete(productTagRelationTable)
        .where(inArray(productTagRelationTable.tagId, productTag.ids))
    } catch {
      throw new Error("商品タグの削除に失敗しました")
    }
  },

  createProductImage: async ({ dbClient, productImage }) => {
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
  },

  updateProductImageByProductId: async ({ dbClient, productImage }) => {
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
  },

  deleteProductImageByProductId: async ({ dbClient, productImage }) => {
    try {
      await dbClient
        .delete(productImageTable)
        .where(eq(productImageTable.productId, productImage.productId))
    } catch {
      throw new Error("画像の削除に失敗しました")
    }
  },
} satisfies Repositories
