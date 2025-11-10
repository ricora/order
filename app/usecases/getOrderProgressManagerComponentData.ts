import type Order from "../domain/order/entities/order"
import { findAllOrders } from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetOrderProgressManagerComponentDataParams = {
  dbClient: DbClient
}

export type OrderProgressManagerComponentData = {
  orders: Order[]
}

export const getOrderProgressManagerComponentData = async ({
  dbClient,
}: GetOrderProgressManagerComponentDataParams): Promise<OrderProgressManagerComponentData> => {
  // TODO: 取得条件を調整する
  const orders = await findAllOrders({
    dbClient,
    pagination: { offset: 0, limit: 1000 },
  })
  return {
    orders: orders,
  }
}
