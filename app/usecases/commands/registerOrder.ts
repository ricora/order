import type Order from "../../domain/order/entities/order"
import { MAX_STORE_PRODUCT_COUNT } from "../../domain/product/constants"
import type { DbClient } from "../../libs/db/client"
import { orderRepository, productRepository } from "../repositories"

const { createOrder } = orderRepository
const { findAllProductsByIds, updateProduct } = productRepository

const createProductNotFoundError = () => {
  return new Error("注文に存在しない商品が含まれています")
}

const createInsufficientStockError = () => {
  return new Error("注文の個数が在庫を上回っています")
}

export type RegisterOrderParams = {
  dbClient: DbClient
  order: Pick<Order, "customerName" | "comment"> & {
    orderItems: Pick<Order["orderItems"][number], "productId" | "quantity">[]
  }
}

export const registerOrder = async ({
  dbClient,
  order,
}: RegisterOrderParams): Promise<Order | null> => {
  let createdOrder: Order | null = null
  await dbClient.transaction(async (tx) => {
    const products = await findAllProductsByIds({
      dbClient: tx,
      product: {
        ids: order.orderItems.map((item) => {
          if (item.productId == null) throw createProductNotFoundError()
          return item.productId
        }),
      },
      pagination: { offset: 0, limit: MAX_STORE_PRODUCT_COUNT },
    })

    const productById = new Map(
      products.map((product) => [product.id, product]),
    )
    const orderItems = order.orderItems.map((orderItem) => {
      const productId = orderItem.productId
      if (productId == null) throw createProductNotFoundError()
      const product = productById.get(productId)
      if (!product) throw createProductNotFoundError()
      return {
        productId: product.id,
        productName: product.name,
        unitAmount: product.price,
        quantity: orderItem.quantity,
      }
    })

    for (const orderItem of orderItems) {
      const product = productById.get(orderItem.productId)
      if (!product) throw createProductNotFoundError()
      const newStock = product.stock - orderItem.quantity
      if (newStock < 0) {
        throw createInsufficientStockError()
      }
      const updatedProduct = await updateProduct({
        dbClient: tx,
        product: {
          id: orderItem.productId,
          stock: newStock,
        },
      })
      if (!updatedProduct) {
        throw createInsufficientStockError()
      }
    }

    const totalAmount = orderItems.reduce(
      (sum, orderItem) => sum + orderItem.unitAmount * orderItem.quantity,
      0,
    )

    createdOrder = await createOrder({
      order: {
        customerName: order.customerName ?? null,
        comment: order.comment ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "pending",
        orderItems: orderItems,
        totalAmount,
      },
      dbClient: tx,
    })
  })
  return createdOrder
}
