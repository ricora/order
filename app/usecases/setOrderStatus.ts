import type Order from "../domain/order/entities/order"
import { updateOrder } from "../domain/order/repositories/orderCommandRepository"
import type { DbClient } from "../infrastructure/db/client"

export type SetOrderStatusParams = {
  dbClient: DbClient
  order: Pick<Order, "id" | "status">
}

export const setOrderStatus = async ({
  dbClient,
  order,
}: SetOrderStatusParams): Promise<Order> => {
  let updatedOrder: Order | null = null
  await dbClient.transaction(async (tx) => {
    updatedOrder = await updateOrder({
      dbClient: tx,
      order: {
        id: order.id,
        status: order.status,
        updatedAt: new Date(),
      },
    })
  })
  if (!updatedOrder) {
    throw new Error("注文が見つかりません")
  }
  return updatedOrder
}
