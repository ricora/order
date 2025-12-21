import type { Order } from "../../domain/order/entities"
import { orderRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const { findOrderById } = orderRepository

export type GetOrderEditPageData = UsecaseFunction<
  { order: Pick<Order, "id"> },
  { order: Order | null },
  "エラーが発生しました。" | "注文が見つかりません。"
>

export const getOrderEditPageData: GetOrderEditPageData = async ({
  dbClient,
  order,
}) => {
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
