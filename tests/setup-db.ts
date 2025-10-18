import { createDbClient } from "../app/infrastructure/db/client"
import { registerOrder } from "../app/usecases/registerOrder"
import { registerProduct } from "../app/usecases/registerProduct"
import { setOrderStatus } from "../app/usecases/setOrderStatus"

const dbClient = await createDbClient()

// 商品登録
await registerProduct({
  dbClient,
  product: {
    name: "テスト商品1",
    price: 1000,
    stock: 100,
    image: null,
    tags: ["タグA", "タグB"],
  },
})
await registerProduct({
  dbClient,
  product: {
    name: "テスト商品2",
    price: 2000,
    stock: 200,
    image: null,
    tags: ["タグC", "タグD"],
  },
})
await registerProduct({
  dbClient,
  product: {
    name: "テスト商品3",
    price: 3000,
    stock: 300,
    image: null,
    tags: ["タグA", "タグC"],
  },
})
await registerProduct({
  dbClient,
  product: {
    name: "テスト商品4",
    price: 4000,
    stock: 400,
    image: null,
    tags: [],
  },
})

// 注文登録
await registerOrder({
  dbClient,
  order: {
    customerName: "顧客A",
    orderItems: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ],
  },
})
await registerOrder({
  dbClient,
  order: {
    customerName: "顧客B",
    orderItems: [
      { productId: 2, quantity: 1 },
      { productId: 3, quantity: 2 },
    ],
  },
})
const order3 = await registerOrder({
  dbClient,
  order: {
    customerName: null,
    orderItems: [
      { productId: 1, quantity: 1 },
      { productId: 3, quantity: 2 },
      { productId: 4, quantity: 3 },
    ],
  },
})
if (order3 == null) throw new Error("Failed to create order")
await setOrderStatus({
  dbClient: dbClient,
  order: { id: order3.id, status: "processing" },
})
const order4 = await registerOrder({
  dbClient,
  order: {
    customerName: "顧客C",
    orderItems: [{ productId: 4, quantity: 5 }],
  },
})
if (order4 == null) throw new Error("Failed to create order")
await setOrderStatus({
  dbClient: dbClient,
  order: { id: order4.id, status: "completed" },
})
const order5 = await registerOrder({
  dbClient,
  order: {
    customerName: "顧客D",
    orderItems: [{ productId: 1, quantity: 5 }],
  },
})
if (order5 == null) throw new Error("Failed to create order")
await setOrderStatus({
  dbClient: dbClient,
  order: { id: order5.id, status: "cancelled" },
})
