import type Order from "../domain/order/entities/order"
import { findAllOrders } from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetOrderProgressPageDataParams = {
  dbClient: DbClient
}

export type OrderProgressPageData = {
  orders: Order[]
}

export const getOrderProgressPageData = async ({
  dbClient,
}: GetOrderProgressPageDataParams): Promise<OrderProgressPageData> => {
  // TODO: limitをつける
  const orders = await findAllOrders({ dbClient })
  return {
    orders: orders,
  }
}
