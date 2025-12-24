import type { Order } from "../../domain/order/entities"
import { MAX_STORE_PRODUCT_COUNT } from "../../domain/product/constants"
import { orderRepository, productRepository } from "../repositories-provider"
import type { UsecaseFunction } from "../types"

const PRODUCT_NOT_FOUND = "注文に存在しない商品が含まれています。" as const
const INSUFFICIENT_STOCK = "注文の個数が在庫を上回っています。" as const
const INTERNAL_ERROR = "エラーが発生しました。" as const
const CUSTOMER_NAME_LENGTH_ERROR =
  "顧客名は50文字以内である必要があります。" as const
const COMMENT_LENGTH_ERROR =
  "コメントは250文字以内である必要があります。" as const
const ORDER_ITEMS_COUNT_ERROR =
  "注文項目は1種類以上20種類以下である必要があります。" as const
const ORDER_ITEM_QUANTITY_MIN_ERROR =
  "注文項目の数量は1以上である必要があります。" as const

const WHITELISTED_ORDER_ERRORS = new Set<string>([
  CUSTOMER_NAME_LENGTH_ERROR,
  COMMENT_LENGTH_ERROR,
  ORDER_ITEMS_COUNT_ERROR,
  ORDER_ITEM_QUANTITY_MIN_ERROR,
])

const isWhitelistedError = (v: unknown): v is RegisterOrderError =>
  typeof v === "string" && WHITELISTED_ORDER_ERRORS.has(v)

type RegisterOrderError =
  | typeof PRODUCT_NOT_FOUND
  | typeof INSUFFICIENT_STOCK
  | typeof CUSTOMER_NAME_LENGTH_ERROR
  | typeof COMMENT_LENGTH_ERROR
  | typeof ORDER_ITEMS_COUNT_ERROR
  | typeof ORDER_ITEM_QUANTITY_MIN_ERROR
  | typeof INTERNAL_ERROR

export type RegisterOrder = UsecaseFunction<
  {
    order: Pick<Order, "customerName" | "comment"> & {
      orderItems: {
        quantity: Order["orderItems"][number]["quantity"]
        productId: NonNullable<Order["orderItems"][number]["productId"]>
      }[]
    }
  },
  Order,
  RegisterOrderError
>

export const registerOrder: RegisterOrder = async ({ dbClient, order }) => {
  const ids = order.orderItems.map((item) => item.productId)
  let errorMessage: RegisterOrderError = INTERNAL_ERROR
  try {
    const txResult = await dbClient.transaction(async (tx) => {
      const productsResult = await productRepository.findAllProductsByIds({
        dbClient: tx,
        product: { ids },
        pagination: { offset: 0, limit: MAX_STORE_PRODUCT_COUNT },
      })
      if (!productsResult.ok) {
        throw new Error()
      }
      const products = productsResult.value
      const productById = new Map<number, (typeof products)[number]>(
        products.map((p) => [p.id, p]),
      )

      const orderItems = order.orderItems
        .map(({ productId, quantity }) => {
          const product = productById.get(productId)
          if (!product) return null
          return {
            productId: product.id,
            productName: product.name,
            unitAmount: product.price,
            quantity,
          }
        })
        .filter((item) => item !== null)
      if (orderItems.length !== order.orderItems.length) {
        errorMessage = PRODUCT_NOT_FOUND
        throw new Error()
      }
      for (const orderItem of orderItems) {
        const product = productById.get(orderItem.productId)
        if (!product) {
          errorMessage = PRODUCT_NOT_FOUND
          throw new Error()
        }
        const newStock = product.stock - orderItem.quantity
        if (newStock < 0) {
          errorMessage = INSUFFICIENT_STOCK
          throw new Error()
        }
        const updatedProductResult = await productRepository.updateProduct({
          dbClient: tx,
          product: { id: orderItem.productId, stock: newStock },
        })
        if (!updatedProductResult.ok) {
          throw new Error()
        }
      }
      const totalAmount = orderItems.reduce(
        (sum, orderItem) => sum + orderItem.unitAmount * orderItem.quantity,
        0,
      )
      const now = new Date()
      const createOrderResult = await orderRepository.createOrder({
        order: {
          customerName: order.customerName ?? null,
          comment: order.comment ?? null,
          createdAt: now,
          updatedAt: now,
          status: "pending",
          orderItems,
          totalAmount,
        },
        dbClient: tx,
      })
      if (!createOrderResult.ok) {
        const msg = createOrderResult.message
        if (isWhitelistedError(msg)) {
          errorMessage = msg
        }
        throw new Error()
      }
      return { ok: true as const, value: createOrderResult.value }
    })
    return txResult
  } catch {
    return { ok: false as const, message: errorMessage }
  }
}
