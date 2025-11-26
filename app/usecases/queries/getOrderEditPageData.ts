import type Order from "../../domain/order/entities/order"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories"

const { findOrderById } = orderRepository

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
