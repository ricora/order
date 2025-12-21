import type { Product } from "../../domain/product/entities"
import { productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { deleteProduct } = productRepository

export type RemoveProduct = UsecaseFunction<
  { product: Pick<Product, "id"> },
  void,
  never
>

export const removeProduct: RemoveProduct = async ({ dbClient, product }) => {
  const errorMessage = "エラーが発生しました。"
  const txResult = await dbClient.transaction(async (tx) => {
    const result = await (async () => {
      try {
        return await deleteProduct({ dbClient: tx, product })
      } catch {
        return { ok: false, message: errorMessage } as const
      }
    })()
    if (!result.ok) {
      return { ok: false, message: errorMessage } as const
    }
    return { ok: true, value: result.value } as const
  })
  return txResult
}
