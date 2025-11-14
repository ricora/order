import { createDbClient } from "../app/infrastructure/db/client"
import { registerOrder } from "../app/usecases/registerOrder"
import { registerProduct } from "../app/usecases/registerProduct"
import { setOrderStatus } from "../app/usecases/setOrderStatus"

const dbClient = await createDbClient()

// 商品登録
for (let i = 1; i <= 25; i++) {
  await registerProduct({
    dbClient,
    product: {
      name: `テスト商品${i}`,
      price: i * 1000,
      stock: i * 100,
      image:
        i % 3 === 0
          ? {
              data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAp6n2ZcAAAAASUVORK5CYII=",
              mimeType: "image/png",
            }
          : null,
      tags:
        i % 3 === 0
          ? ["タグA", "タグB"]
          : i % 3 === 1
            ? ["タグC", "タグD"]
            : ["タグA", "タグC"],
    },
  })
}

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

// 追加の注文を20個登録
for (let i = 6; i <= 25; i++) {
  const customerNumber = ((i - 6) % 10) + 1
  const productId = ((i - 6) % 5) + 1
  const quantity = ((i - 6) % 5) + 1

  const order = await registerOrder({
    dbClient,
    order: {
      customerName: `テスト顧客${customerNumber}`,
      orderItems: [{ productId, quantity }],
    },
  })

  if (order == null) throw new Error(`Failed to create order ${i}`)

  // 一部の注文のステータスを変更
  if (i % 4 === 0) {
    await setOrderStatus({
      dbClient,
      order: { id: order.id, status: "processing" },
    })
  } else if (i % 4 === 1) {
    await setOrderStatus({
      dbClient,
      order: { id: order.id, status: "completed" },
    })
  } else if (i % 4 === 2) {
    await setOrderStatus({
      dbClient,
      order: { id: order.id, status: "cancelled" },
    })
  }
}
