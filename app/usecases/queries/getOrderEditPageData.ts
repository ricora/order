import type Order from "../../domain/order/entities/order"
import type { Result } from "../../domain/types"
import type { DbClient } from "../../libs/db/client"
import { orderRepository } from "../repositories-provider"

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
}: GetOrderEditPageDataParams): Promise<
  Result<OrderEditPageData, "エラーが発生しました。" | "注文が見つかりません。">
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
