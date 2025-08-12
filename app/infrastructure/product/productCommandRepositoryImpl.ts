import type Product from "../../domain/product/entities/product"
import type {
  CreateProduct,
  DeleteProduct,
  UpdateProduct,
} from "../../domain/product/repositories/productCommandRepository"
import * as cache from "../cache"

export const createProductImpl: CreateProduct = async (params) => {
  try {
    const maxId =
      cache.product.length > 0 ? Math.max(...cache.product.map((p) => p.id)) : 0
    const newProduct: Product = {
      id: maxId + 1,
      ...params,
    }
    cache.product.push(newProduct)
    return Promise.resolve(newProduct)
  } catch (e) {
    return Promise.reject(new Error("商品の作成に失敗しました"))
  }
}

export const updateProductImpl: UpdateProduct = async (params) => {
  try {
    const idx = cache.product.findIndex((p) => p.id === params.id)
    if (idx === -1) return Promise.resolve(null)
    cache.product[idx] = { ...params }
    return Promise.resolve(cache.product[idx])
  } catch (e) {
    return Promise.reject(new Error("商品の更新に失敗しました"))
  }
}

export const deleteProductImpl: DeleteProduct = async (params) => {
  try {
    const idx = cache.product.findIndex((p) => p.id === params.id)
    if (idx !== -1) {
      cache.product.splice(idx, 1)
      return Promise.resolve()
    }
    return Promise.resolve()
  } catch (e) {
    return Promise.reject(new Error("商品の削除に失敗しました"))
  }
}
