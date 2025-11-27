import type Order from "../../domain/order/entities/order"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories-provider"

const { deleteOrder } = orderRepository

export type RemoveOrderParams = {
  dbClient: DbClient
  order: Pick<Order, "id">
}

export const removeOrder = async ({ dbClient, order }: RemoveOrderParams) => {
  await dbClient.transaction(async (tx) => {
    await deleteOrder({ dbClient: tx, order })
  })
}
