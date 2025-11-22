import {
  findAllOrdersByActiveStatusByUpdatedAtAscImpl,
  findAllOrdersByInactiveStatusByUpdatedAtDescImpl,
  findAllOrdersOrderByIdAscImpl,
  findAllOrdersOrderByIdDescImpl,
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
export type FindAllOrdersOrderByIdAsc = PaginatedQueryRepositoryFunction<
  Record<string, never>,
  Order
>
export type FindAllOrdersOrderByIdDesc = PaginatedQueryRepositoryFunction<
  Record<string, never>,
  Order
>
export type FindAllOrdersByActiveStatusOrderByUpdatedAtAsc =
  PaginatedQueryRepositoryFunction<Record<string, never>, Order>
export type FindAllOrdersByInactiveStatusOrderByUpdatedAtDesc =
  PaginatedQueryRepositoryFunction<Record<string, never>, Order>

export const findOrderById: WithRepositoryImpl<FindOrderById> = async ({
  order,
  repositoryImpl = findOrderByIdImpl,
  dbClient,
}) => {
  return repositoryImpl({ order, dbClient })
}

export const findAllOrdersOrderByIdAsc: WithRepositoryImpl<
  FindAllOrdersOrderByIdAsc
> = async ({
  repositoryImpl = findAllOrdersOrderByIdAscImpl,
  dbClient,
  pagination,
}) => {
  return repositoryImpl({ dbClient, pagination })
}

export const findAllOrdersOrderByIdDesc: WithRepositoryImpl<
  FindAllOrdersOrderByIdDesc
> = async ({
  repositoryImpl = findAllOrdersOrderByIdDescImpl,
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
