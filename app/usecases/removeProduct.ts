import type Product from "../domain/product/entities/product"
import { deleteProduct } from "../domain/product/repositories/productCommandRepository"
import type { DbClient } from "../infrastructure/db/client"

export type RemoveProductParams = {
  dbClient: DbClient
  product: Pick<Product, "id">
}

export const removeProduct = async ({
  dbClient,
  product,
}: RemoveProductParams) => {
  await dbClient.transaction(async (tx) => {
    await deleteProduct({ dbClient: tx, product })
  })
}
