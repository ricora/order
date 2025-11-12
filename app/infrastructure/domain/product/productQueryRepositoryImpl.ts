import { asc, eq, inArray } from "drizzle-orm"
import type {
  FindAllProductStocks,
  FindAllProducts,
  FindAllProductsByIds,
  FindProductById,
  FindProductByName,
} from "../../../domain/product/repositories/productQueryRepository"
import type { productImageTable } from "../../db/schema"
import { productTable } from "../../db/schema"

const mapImage = (
  dbImage: typeof productImageTable.$inferSelect | null,
): NonNullable<Awaited<ReturnType<FindProductById>>>["image"] => {
  return dbImage?.data && dbImage.mimeType
    ? { data: dbImage.data, mimeType: dbImage.mimeType }
    : null
}
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
      productImage: true,
    },
  })
  if (!dbProduct) return null

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    tagIds: dbProduct.productTags.map((tag) => tag.tagId),
    price: dbProduct.price,
    stock: dbProduct.stock,
    image: mapImage(dbProduct.productImage),
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
      productImage: true,
    },
  })
  if (!dbProduct) return null

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    tagIds: dbProduct.productTags.map((tag) => tag.tagId),
    price: dbProduct.price,
    stock: dbProduct.stock,
    image: mapImage(dbProduct.productImage),
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
      productImage: true,
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
    image: mapImage(dbProduct.productImage),
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
      productImage: true,
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
    image: mapImage(dbProduct.productImage),
  }))
}
