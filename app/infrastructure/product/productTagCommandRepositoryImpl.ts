import type ProductTag from "../../domain/product/entities/productTag"
import type { CreateProductTag } from "../../domain/product/repositories/productTagCommandRepository"
import * as cache from "../cache"

export const createProductTagImpl: CreateProductTag = async (params) => {
  try {
    const maxId =
      cache.productTags.length > 0
        ? Math.max(...cache.productTags.map((t) => t.id))
        : 0
    const newTag: ProductTag = {
      id: maxId + 1,
      name: params.name,
    }
    cache.productTags.push(newTag)
    return Promise.resolve(newTag)
  } catch (e) {
    return Promise.reject(new Error("商品タグの作成に失敗しました"))
  }
}
