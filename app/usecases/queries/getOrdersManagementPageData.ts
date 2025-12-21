import type { Order } from "../../domain/order/entities"
import { orderRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { findAllOrdersOrderByIdAsc, findAllOrdersOrderByIdDesc } =
  orderRepository

export type GetOrdersManagementPageData = UsecaseFunction<
  { page?: number; sort?: "asc" | "desc" },
  {
    orders: Order[]
    hasNextPage: boolean
    currentPage: number
    pageSize: number
  },
  "エラーが発生しました。"
>

export const getOrdersManagementPageData: GetOrdersManagementPageData = async ({
  dbClient,
  page = 1,
  sort = "asc",
}) => {
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
