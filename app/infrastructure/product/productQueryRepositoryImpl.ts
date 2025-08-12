import type {
  FindAllProducts,
  FindProductById,
} from "../../domain/product/repositories/productQueryRepository"
import * as cache from "../cache"

export const findProductByIdImpl: FindProductById = async ({ id }) => {
  const product = cache.product.find((p) => p.id === id) ?? null
  return Promise.resolve(product)
}

export const findAllProductsImpl: FindAllProducts = async () => {
  return Promise.resolve(cache.product)
}
