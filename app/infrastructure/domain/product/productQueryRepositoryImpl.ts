import { eq, inArray } from "drizzle-orm"
import type {
  FindAllProductStocks,
  FindAllProducts,
  FindAllProductsByIds,
  FindProductById,
  FindProductByName,
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

export const findProductByNameImpl: FindProductByName = async ({
  dbClient,
  product,
}) => {
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
    image: dbProduct.image,
    tagIds: dbProduct.productTags.map((tag) => tag.tagId),
    price: dbProduct.price,
    stock: dbProduct.stock,
  }
}

export const findAllProductsImpl: FindAllProducts = async ({
  dbClient,
  pagination,
}) => {
  const dbProducts = await dbClient.query.productTable.findMany({
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

export const findAllProductStocksImpl: FindAllProductStocks = async ({
  dbClient,
  pagination,
}) => {
  const dbProducts = await dbClient.query.productTable.findMany({
    columns: {
      stock: true,
    },
    offset: pagination.offset,
    limit: pagination.limit,
  })
  const products = dbProducts.map((dbProduct) => ({
    stock: dbProduct.stock,
  }))
  return products
}

export const findAllProductsByIdsImpl: FindAllProductsByIds = async ({
  dbClient,
  product,
  pagination,
}) => {
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
