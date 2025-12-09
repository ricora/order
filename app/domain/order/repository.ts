import { countStringLength } from "../../utils/text"
import type {
  CommandRepositoryFunction,
  PaginatedQueryRepositoryFunction,
  QueryRepositoryFunction,
  Result,
} from "../types"
import { ALLOWED_ORDER_STATUSES } from "./constants"
import type { Order } from "./entities"

type CommonOrderValidationError =
  | "顧客名は50文字以内である必要があります。"
  | "コメントは250文字以内である必要があります。"
  | "注文項目は1種類以上20種類以下である必要があります。"
  | "注文項目の数量は1以上である必要があります。"
  | "注文項目の単価は0以上である必要があります。"
  | "商品名は1文字以上500文字以内である必要があります。"
  | "合計金額が正しくありません。"
  | "注文の状態は'pending', 'processing', 'completed', 'cancelled'のいずれかである必要があります。"

type CreateOrderValidationError =
  | CommonOrderValidationError
  | "新規に登録する注文の状態は'pending'である必要があります。"
  | "新規に登録する注文の作成日時と更新日時は同じである必要があります。"

type UpdateOrderValidationError =
  | CommonOrderValidationError
  | "注文が見つかりません。"

export type Repository = {
  // Query
  findOrderById: QueryRepositoryFunction<
    { order: Pick<Order, "id"> },
    Order,
    "注文が見つかりません。"
  >
  findAllOrdersOrderByIdAsc: PaginatedQueryRepositoryFunction<
    unknown,
    Order,
    never
  >
  findAllOrdersOrderByIdDesc: PaginatedQueryRepositoryFunction<
    unknown,
    Order,
    never
  >
  findAllOrdersByActiveStatusOrderByUpdatedAtAsc: PaginatedQueryRepositoryFunction<
    unknown,
    Order,
    never
  >
  findAllOrdersByInactiveStatusOrderByUpdatedAtDesc: PaginatedQueryRepositoryFunction<
    unknown,
    Order,
    never
  >

  // Command
  createOrder: CommandRepositoryFunction<
    { order: Omit<Order, "id"> },
    Order,
    CreateOrderValidationError
  >
  updateOrder: CommandRepositoryFunction<
    {
      order: Pick<Order, "id" | "updatedAt"> &
        Partial<Pick<Order, "customerName" | "comment" | "status">>
    },
    Order,
    UpdateOrderValidationError
  >
  deleteOrder: CommandRepositoryFunction<
    { order: Pick<Order, "id"> },
    void,
    never
  >
}

export const createRepository = (adapters: Repository) => {
  type CreateOrderParam = Parameters<Repository["createOrder"]>[0]["order"]
  type UpdateOrderParam = Parameters<Repository["updateOrder"]>[0]["order"]
  type CommonOrderParam = CreateOrderParam | UpdateOrderParam

  const validateCommonOrder = (
    order: CommonOrderParam,
  ): Result<void, CommonOrderValidationError> => {
    if (order.status) {
      if (!ALLOWED_ORDER_STATUSES.has(order.status)) {
        return {
          ok: false,
          message:
            "注文の状態は'pending', 'processing', 'completed', 'cancelled'のいずれかである必要があります。",
        }
      }
    }
    if (order.customerName !== undefined) {
      if (
        order.customerName !== null &&
        countStringLength(order.customerName) > 50
      ) {
        return {
          ok: false,
          message: "顧客名は50文字以内である必要があります。",
        }
      }
    }
    if (order.comment !== undefined) {
      if (order.comment !== null && countStringLength(order.comment) > 250) {
        return {
          ok: false,
          message: "コメントは250文字以内である必要があります。",
        }
      }
    }
    return { ok: true, value: undefined }
  }

  const repository = {
    findOrderById: async ({ dbClient, order }) => {
      return adapters.findOrderById({ dbClient, order })
    },
    findAllOrdersOrderByIdAsc: async ({ dbClient, pagination }) => {
      return adapters.findAllOrdersOrderByIdAsc({ dbClient, pagination })
    },
    findAllOrdersOrderByIdDesc: async ({ dbClient, pagination }) => {
      return adapters.findAllOrdersOrderByIdDesc({ dbClient, pagination })
    },
    findAllOrdersByActiveStatusOrderByUpdatedAtAsc: async ({
      dbClient,
      pagination,
    }) => {
      return adapters.findAllOrdersByActiveStatusOrderByUpdatedAtAsc({
        dbClient,
        pagination,
      })
    },
    findAllOrdersByInactiveStatusOrderByUpdatedAtDesc: async ({
      dbClient,
      pagination,
    }) => {
      return adapters.findAllOrdersByInactiveStatusOrderByUpdatedAtDesc({
        dbClient,
        pagination,
      })
    },
    createOrder: async ({ dbClient, order }) => {
      const validateCommonResult = validateCommonOrder(order)
      if (!validateCommonResult.ok) return validateCommonResult

      if (order.status && order.status !== "pending") {
        return {
          ok: false,
          message: "新規に登録する注文の状態は'pending'である必要があります。",
        }
      }
      if (order.createdAt !== undefined && order.updatedAt !== undefined) {
        if (order.createdAt !== order.updatedAt) {
          return {
            ok: false,
            message:
              "新規に登録する注文の作成日時と更新日時は同じである必要があります。",
          }
        }
      }
      if (order.orderItems) {
        if (
          order.totalAmount !==
          order.orderItems.reduce(
            (sum, item) => sum + item.unitAmount * item.quantity,
            0,
          )
        ) {
          return {
            ok: false,
            message: "合計金額が正しくありません。",
          }
        }
        if (order.orderItems.length < 1 || order.orderItems.length > 20) {
          return {
            ok: false,
            message: "注文項目は1種類以上20種類以下である必要があります。",
          }
        }
        for (const item of order.orderItems) {
          if (item.quantity < 1)
            return {
              ok: false,
              message: "注文項目の数量は1以上である必要があります。",
            }
          if (item.unitAmount < 0)
            return {
              ok: false,
              message: "注文項目の単価は0以上である必要があります。",
            }
          if (
            countStringLength(item.productName) < 1 ||
            countStringLength(item.productName) > 500
          ) {
            return {
              ok: false,
              message: "商品名は1文字以上500文字以内である必要があります。",
            }
          }
        }
      }
      return adapters.createOrder({ order, dbClient })
    },
    updateOrder: async ({ dbClient, order }) => {
      const validateCommonResult = validateCommonOrder(order)
      if (!validateCommonResult.ok) return validateCommonResult

      const foundOrder = await repository.findOrderById({
        dbClient,
        order: { id: order.id },
      })
      if (!foundOrder.ok) {
        return {
          ok: false,
          message: "注文が見つかりません。",
        }
      }

      return adapters.updateOrder({ order, dbClient })
    },
    deleteOrder: async ({ dbClient, order }) => {
      return adapters.deleteOrder({ dbClient, order })
    },
  } satisfies Repository

  return repository
}
