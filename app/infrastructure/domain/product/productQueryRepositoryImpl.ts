import { asc, desc, eq, inArray } from "drizzle-orm"
import type {
  CountProducts,
  FindAllProductStocks,
  FindAllProductsByIds,
  FindAllProductsOrderByIdAsc,
  FindAllProductsOrderByIdDesc,
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
    tagIds: dbProduct.productTags.map((tag) => tag.tagId),
    price: dbProduct.price,
    stock: dbProduct.stock,
  }
}

export const findAllProductsOrderByIdAscImpl: FindAllProductsOrderByIdAsc =
  async ({ dbClient, pagination }) => {
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
  }

export const findAllProductsOrderByIdDescImpl: FindAllProductsOrderByIdDesc =
  async ({ dbClient, pagination }) => {
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
  }

export const findAllProductStocksImpl: FindAllProductStocks = async ({
  dbClient,
  pagination,
}) => {
  const dbProducts = await dbClient.query.productTable.findMany({
    columns: {
      stock: true,
    },
    orderBy: [asc(productTable.id)],
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
  return dbProducts.map((dbProduct) => ({
    id: dbProduct.id,
    name: dbProduct.name,
    tagIds: dbProduct.productTags.map((tag) => tag.tagId),
    price: dbProduct.price,
    stock: dbProduct.stock,
  }))
}

export const countProductsImpl: CountProducts = async ({ dbClient }) => {
  return await dbClient.$count(productTable)
}
