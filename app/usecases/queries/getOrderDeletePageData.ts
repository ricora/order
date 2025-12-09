import type { Order } from "../../domain/order/entities"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories-provider"

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
}: GetOrderDeletePageDataParams): Promise<
  Result<
    OrderDeletePageData,
    "エラーが発生しました。" | "注文が見つかりません。"
  >
> => {
  try {
    const foundOrderResult = await findOrderById({ dbClient, order })
    if (!foundOrderResult.ok) {
      if (foundOrderResult.message === "注文が見つかりません。") {
        return { ok: false, message: "注文が見つかりません。" }
      }
      return { ok: false, message: "エラーが発生しました。" }
    }
    return { ok: true, value: { order: foundOrderResult.value } }
  } catch {
    return { ok: false, message: "エラーが発生しました。" }
  }
}
