import type { Order } from "../../domain/order/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories-provider"

const { findAllOrdersOrderByIdAsc, findAllOrdersOrderByIdDesc } =
  orderRepository

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
}: GetOrdersManagementPageDataParams): Promise<
  Result<OrdersManagementPageData, "エラーが発生しました。">
> => {
  const pageSize = 50
  const offset = Math.max(0, (page - 1) * pageSize)

  try {
    const ordersWithExtraResult = await (sort === "asc"
      ? findAllOrdersOrderByIdAsc
      : findAllOrdersOrderByIdDesc)({
      dbClient,
      pagination: { offset, limit: pageSize + 1 },
    })
    if (!ordersWithExtraResult.ok) {
      return { ok: false, message: "エラーが発生しました。" }
    }
    const ordersWithExtra = ordersWithExtraResult.value
    const hasNextPage = ordersWithExtra.length > pageSize
    const orders = ordersWithExtra.slice(0, pageSize)

    return {
      ok: true,
      value: {
        orders,
        hasNextPage,
        currentPage: page,
        pageSize,
      },
    }
  } catch {
    return { ok: false, message: "エラーが発生しました。" }
  }
}
