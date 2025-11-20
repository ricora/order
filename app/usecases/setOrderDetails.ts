import type Order from "../domain/order/entities/order"
import { updateOrder as updateOrderRepo } from "../domain/order/repositories/orderCommandRepository"
import type { DbClient } from "../infrastructure/db/client"

export type SetOrderDetailsParams = {
  dbClient: DbClient
  order: Pick<Order, "id"> &
    Partial<Pick<Order, "customerName" | "comment" | "status">>
}

export const setOrderDetails = async ({
  dbClient,
  order,
}: SetOrderDetailsParams): Promise<Order> => {
  let updatedOrder: Order | null = null
  await dbClient.transaction(async (tx) => {
    updatedOrder = await updateOrderRepo({
      dbClient: tx,
      order: {
        id: order.id,
        customerName: order.customerName,
        comment: order.comment,
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
