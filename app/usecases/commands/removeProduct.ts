import type Product from "../../domain/product/entities/product"
import type { DbClient } from "../../libs/db/client"
import { productRepository } from "../repositories"

const { deleteProduct } = productRepository

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
