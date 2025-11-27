import { adapters as orderAdapters } from "../domain/order/adapters"
import { createRepositories as createOrderRepositories } from "../domain/order/repositories"
import { adapters as productAdapters } from "../domain/product/adapters"
import { createRepositories as createProductRepositories } from "../domain/product/repositories"

export const orderRepository = createOrderRepositories(orderAdapters)
export const productRepository = createProductRepositories(productAdapters)
