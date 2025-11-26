import type Order from "../../domain/order/entities/order"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories"

const { findOrderById } = orderRepository

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
  return {
    order: foundOrder,
  }
}
