import {
  findAllOrdersByActiveStatusByUpdatedAtAscImpl,
  findAllOrdersByInactiveStatusByUpdatedAtDescImpl,
  findAllOrdersImpl,
  findAllDailyOrderAggregationsImpl,
  findOrderByIdImpl,
  findOrderStatusCountsImpl,
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
export type FindAllOrdersByActiveStatusOrderByUpdatedAtAsc =
  PaginatedQueryRepositoryFunction<Record<string, never>, Order>
export type FindAllOrdersByInactiveStatusOrderByUpdatedAtDesc =
  PaginatedQueryRepositoryFunction<Record<string, never>, Order>

type OrderStatusCount = {
  status: Order["status"]
  count: number
}

type OrderDailyAggregation = {
  date: Date
  orderCount: number
  revenue: number
}

export type FindOrderStatusCounts = QueryRepositoryFunction<
  Record<string, never>,
  OrderStatusCount[]
>

export type FindAllDailyOrderAggregations =
  PaginatedQueryRepositoryFunction<
    {
      from: Date
      to: Date
    },
    OrderDailyAggregation
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

export const findAllOrdersByActiveStatusOrderByUpdatedAtAsc: WithRepositoryImpl<
  FindAllOrdersByActiveStatusOrderByUpdatedAtAsc
> = async ({
  repositoryImpl = findAllOrdersByActiveStatusByUpdatedAtAscImpl,
  dbClient,
  pagination,
}) => {
  return repositoryImpl({ dbClient, pagination })
}

export const findAllOrdersByInactiveStatusOrderByUpdatedAtDesc: WithRepositoryImpl<
  FindAllOrdersByInactiveStatusOrderByUpdatedAtDesc
> = async ({
  repositoryImpl = findAllOrdersByInactiveStatusByUpdatedAtDescImpl,
  dbClient,
  pagination,
}) => {
  return repositoryImpl({ dbClient, pagination })
}

export const findOrderStatusCounts: WithRepositoryImpl<
  FindOrderStatusCounts
> = async ({ repositoryImpl = findOrderStatusCountsImpl, dbClient }) => {
  return repositoryImpl({ dbClient })
}

export const findAllDailyOrderAggregations: WithRepositoryImpl<
  FindAllDailyOrderAggregations
> = async ({
  repositoryImpl = findAllDailyOrderAggregationsImpl,
  dbClient,
  from,
  to,
  pagination,
}) => {
  return repositoryImpl({ dbClient, from, to, pagination })
}
