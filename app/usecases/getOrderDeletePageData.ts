import type Order from "../domain/order/entities/order"
import { findOrderById } from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetOrderDeletePageDataParams = {
  dbClient: DbClient
  order: Pick<Order, "id">
}

export type OrderDeletePageData = {
  order: Order | null
}

export const getOrderDeletePageData = async ({
  dbClient,
  order,
}: GetOrderDeletePageDataParams): Promise<OrderDeletePageData> => {
  const foundOrder = await findOrderById({ dbClient, order })
  if (!foundOrder) {
    return { order: null }
  }
  return {
    order: foundOrder,
  }
}
