import { createDbClient } from "../app/libs/db/client"
import { registerOrder } from "../app/usecases/commands/registerOrder"
import { registerProduct } from "../app/usecases/commands/registerProduct"
import { setOrderStatus } from "../app/usecases/commands/setOrderStatus"

const dbClient = await createDbClient()

// 商品登録
for (let i = 1; i <= 150; i++) {
  const productRes = await registerProduct({
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
  if (!productRes.ok) throw new Error(productRes.message)
}

// 注文登録
const orderRes1 = await registerOrder({
  dbClient,
  order: {
    customerName: "顧客A",
    comment: null,
    orderItems: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ],
  },
})
if (!orderRes1.ok) throw new Error(orderRes1.message)

const orderRes2 = await registerOrder({
  dbClient,
  order: {
    customerName: "顧客B",
    comment: null,
    orderItems: [
      { productId: 2, quantity: 1 },
      { productId: 3, quantity: 2 },
    ],
  },
})
if (!orderRes2.ok) throw new Error(orderRes2.message)

const order3Res = await registerOrder({
  dbClient,
  order: {
    customerName: null,
    comment: null,
    orderItems: [
      { productId: 1, quantity: 1 },
      { productId: 3, quantity: 2 },
      { productId: 4, quantity: 3 },
    ],
  },
})
if (!order3Res.ok) throw new Error(order3Res.message)
const order3 = order3Res.value
const setRes3 = await setOrderStatus({
  dbClient: dbClient,
  order: { id: order3.id, status: "processing" },
})
if (!setRes3.ok) throw new Error(setRes3.message)

const order4Res = await registerOrder({
  dbClient,
  order: {
    customerName: "顧客C",
    comment: null,
    orderItems: [{ productId: 4, quantity: 5 }],
  },
})
if (!order4Res.ok) throw new Error(order4Res.message)
const order4 = order4Res.value
const setRes4 = await setOrderStatus({
  dbClient: dbClient,
  order: { id: order4.id, status: "completed" },
})
if (!setRes4.ok) throw new Error(setRes4.message)

const order5Res = await registerOrder({
  dbClient,
  order: {
    customerName: "顧客D",
    comment: null,
    orderItems: [{ productId: 1, quantity: 5 }],
  },
})
if (!order5Res.ok) throw new Error(order5Res.message)
const order5 = order5Res.value
const setRes5 = await setOrderStatus({
  dbClient: dbClient,
  order: { id: order5.id, status: "cancelled" },
})
if (!setRes5.ok) throw new Error(setRes5.message)

// 追加の注文登録
const customers = ["テスト顧客A", "テスト顧客B", "テスト顧客C", "テスト顧客D"]
for (let i = 6; i <= 155; i++) {
  const customerName = customers[(i - 6) % customers.length] || "テスト顧客A"
  const productId = ((i - 6) % 150) + 1
  const quantity = ((i - 6) % 5) + 1

  const orderRes = await registerOrder({
    dbClient,
    order: {
      customerName,
      comment: null,
      orderItems: [{ productId, quantity }],
    },
  })

  if (!orderRes.ok)
    throw new Error(`Failed to create order ${i}: ${orderRes.message}`)
  const order = orderRes.value

  // 一部の注文のステータスを変更
  if (i % 4 === 0) {
    const setRes = await setOrderStatus({
      dbClient,
      order: { id: order.id, status: "processing" },
    })
    if (!setRes.ok) throw new Error(setRes.message)
  } else if (i % 4 === 1) {
    const setRes = await setOrderStatus({
      dbClient,
      order: { id: order.id, status: "completed" },
    })
    if (!setRes.ok) throw new Error(setRes.message)
  } else if (i % 4 === 2) {
    const setRes = await setOrderStatus({
      dbClient,
      order: { id: order.id, status: "cancelled" },
    })
    if (!setRes.ok) throw new Error(setRes.message)
  }
}

console.info("Database setup completed.")
process.exit(0)
