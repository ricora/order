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
  const errorMessage = "エラーが発生しました。" as const
  try {
    const txResult = await dbClient.transaction(async (tx) => {
      const result = await deleteProduct({ dbClient: tx, product })
      if (!result.ok) {
        throw new Error()
      }

      return { ok: true, value: result.value } as const
    })
    return txResult
  } catch {
    return { ok: false, message: errorMessage } as const
  }
}
