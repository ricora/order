import { eq } from "drizzle-orm"
import type {
  FindAllProducts,
  FindProductById,
} from "../../../domain/product/repositories/productQueryRepository"
import { productTable } from "../../db/schema"

export const findProductByIdImpl: FindProductById = async ({
  dbClient,
  product,
}) => {
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
    image: dbProduct.image,
    tagIds: dbProduct.productTags.map((tag) => tag.tagId),
    price: dbProduct.price,
    stock: dbProduct.stock,
  }
}

export const findAllProductsImpl: FindAllProducts = async ({ dbClient }) => {
  const dbProducts = await dbClient.query.productTable.findMany({
    with: {
      productTags: {
        columns: {
          tagId: true,
        },
      },
    },
  })
  const products = dbProducts.map((dbProduct) => ({
    id: dbProduct.id,
    name: dbProduct.name,
    image: dbProduct.image,
    tagIds: dbProduct.productTags.map((tag) => tag.tagId),
    price: dbProduct.price,
    stock: dbProduct.stock,
  }))
  return products
}
