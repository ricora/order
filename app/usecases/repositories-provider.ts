import { adapters as orderAdapters } from "../domain/order/adapters"
import { createRepository as createOrderRepository } from "../domain/order/repository"
import { adapters as productAdapters } from "../domain/product/adapters"
import { createRepository as createProductRepository } from "../domain/product/repository"

export const orderRepository = createOrderRepository(orderAdapters)
export const productRepository = createProductRepository(productAdapters)
