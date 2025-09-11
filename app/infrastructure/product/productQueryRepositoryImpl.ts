import { eq, sql } from "drizzle-orm"
import type {
  FindAllProducts,
  FindProductById,
} from "../../domain/product/repositories/productQueryRepository"
import { productTable, productTagRelationTable } from "../db/schema"

export const findProductByIdImpl: FindProductById = async ({
  dbClient,
  product,
}) => {
  const dbProduct = (
    await dbClient
      .select({
        id: productTable.id,
        name: productTable.name,
        image: productTable.image,
        price: productTable.price,
        stock: productTable.stock,
        tagIds: sql<
          number[]
        >`coalesce(array_agg(${productTagRelationTable.tagId}), '{}')`,
      })
      .from(productTable)
      .leftJoin(
        productTagRelationTable,
        eq(productTable.id, productTagRelationTable.productId),
      )
      .where(eq(productTable.id, product.id))
      .groupBy(
        productTable.id,
        productTable.name,
        productTable.image,
        productTable.price,
        productTable.stock,
      )
  )[0]

  if (!dbProduct) return Promise.resolve(null)
  return Promise.resolve({
    id: dbProduct.id,
    name: dbProduct.name,
    image: dbProduct.image,
    tagIds: dbProduct.tagIds,
    price: dbProduct.price,
    stock: dbProduct.stock,
  })
}

export const findAllProductsImpl: FindAllProducts = async ({ dbClient }) => {
  const dbRows = await dbClient
    .select({
      id: productTable.id,
      name: productTable.name,
      image: productTable.image,
      price: productTable.price,
      stock: productTable.stock,
      tagIds: sql<
        number[]
      >`coalesce(array_agg(${productTagRelationTable.tagId}), '{}')`,
    })
    .from(productTable)
    .leftJoin(
      productTagRelationTable,
      eq(productTable.id, productTagRelationTable.productId),
    )
    .groupBy(
      productTable.id,
      productTable.name,
      productTable.image,
      productTable.price,
      productTable.stock,
    )

  const products = dbRows.map((r) => ({
    id: r.id,
    name: r.name,
    image: r.image,
    tagIds: r.tagIds,
    price: r.price,
    stock: r.stock,
  }))
  return Promise.resolve(products)
}
