import {
  findAllOrdersImpl,
  findOrderByIdImpl,
} from "../../../infrastructure/domain/order/orderQueryRepositoryImpl"
import type {
  PaginatedQueryRepositoryFunction,
  QueryRepositoryFunction,
  WithRepositoryImpl,
} from "../../types"
import type Order from "../entities/order"

export type FindOrderById = QueryRepositoryFunction<
  { order: Pick<Order, "id"> },
  Order | null
>
export type FindAllOrders = PaginatedQueryRepositoryFunction<
  Record<string, never>,
  Order
>

export const findOrderById: WithRepositoryImpl<FindOrderById> = async ({
  order,
  repositoryImpl = findOrderByIdImpl,
  dbClient,
}) => {
  return repositoryImpl({ order, dbClient })
}

export const findAllOrders: WithRepositoryImpl<FindAllOrders> = async ({
  repositoryImpl = findAllOrdersImpl,
  dbClient,
  pagination,
}) => {
  return repositoryImpl({ dbClient, pagination })
}
