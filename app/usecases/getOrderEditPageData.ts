import type Order from "../domain/order/entities/order"
import { findOrderById } from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetOrderEditPageDataParams = {
  dbClient: DbClient
  order: Pick<Order, "id">
}

export type OrderEditPageData = {
  order: Order | null
}

export const getOrderEditPageData = async ({
  dbClient,
  order,
}: GetOrderEditPageDataParams): Promise<OrderEditPageData> => {
  const foundOrder = await findOrderById({ dbClient, order })
  return {
    order: foundOrder,
  }
}
