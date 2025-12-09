import type { Product } from "../../domain/product/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories-provider"

const { deleteProduct } = productRepository

export type RemoveProductParams = {
  dbClient: DbClient
  product: Pick<Product, "id">
}

export const removeProduct = async ({
  dbClient,
  product,
}: RemoveProductParams): Promise<Result<void, "エラーが発生しました。">> => {
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
