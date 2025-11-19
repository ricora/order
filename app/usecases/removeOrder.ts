import type Order from "../domain/order/entities/order"
import { deleteOrder } from "../domain/order/repositories/orderCommandRepository"
import type { DbClient } from "../infrastructure/db/client"

export type RemoveOrderParams = {
  dbClient: DbClient
  order: Pick<Order, "id">
}

export const removeOrder = async ({ dbClient, order }: RemoveOrderParams) => {
  await dbClient.transaction(async (tx) => {
    await deleteOrder({ dbClient: tx, order })
  })
}
