import type Order from "../domain/order/entities/order"
import {
  findAllOrdersOrderByIdAsc,
  findAllOrdersOrderByIdDesc,
} from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"

export type GetOrdersManagementPageDataParams = {
  dbClient: DbClient
  page?: number
  sort?: "asc" | "desc"
}

export type OrdersManagementPageData = {
  orders: Order[]
  hasNextPage: boolean
  currentPage: number
  pageSize: number
}

export const getOrdersManagementPageData = async ({
  dbClient,
  page = 1,
  sort = "asc",
}: GetOrdersManagementPageDataParams): Promise<OrdersManagementPageData> => {
  const pageSize = 50
  const offset = Math.max(0, (page - 1) * pageSize)

  const ordersWithExtra = await (sort === "asc"
    ? findAllOrdersOrderByIdAsc
    : findAllOrdersOrderByIdDesc)({
    dbClient,
    pagination: { offset, limit: pageSize + 1 },
  })
  const hasNextPage = ordersWithExtra.length > pageSize
  const orders = ordersWithExtra.slice(0, pageSize)

  return {
    orders,
    hasNextPage,
    currentPage: page,
    pageSize,
  }
}
