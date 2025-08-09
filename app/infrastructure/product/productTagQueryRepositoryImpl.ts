import type {
  FindAllProductTags,
  FindProductTagById,
} from "../../domain/product/repositories/productTagQueryRepository"
import * as cache from "../cache"

export const findProductTagByIdImpl: FindProductTagById = async ({ id }) => {
  const tag = cache.productTags.find((t) => t.id === id) ?? null
  return Promise.resolve(tag)
}

export const findAllProductTagsImpl: FindAllProductTags = async () => {
  return Promise.resolve(cache.productTags)
}
