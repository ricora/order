import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type Order from "../domain/order/entities/order"
import * as orderQueryRepository from "../domain/order/repositories/orderQueryRepository"
import type { DbClient } from "../infrastructure/db/client"
import { getOrderDeletePageData } from "./getOrderDeletePageData"

const mockOrder: Order = {
  id: 1,
  customerName: "Taro",
  comment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "pending",
  orderItems: [
    { productId: 1, productName: "P1", unitAmount: 100, quantity: 2 },
  ],
  totalAmount: 200,
}

const dbClient = {} as DbClient

describe("getOrderDeletePageData", () => {
  beforeAll(() => {
    spyOn(orderQueryRepository, "findOrderById").mockImplementation(
      async () => mockOrder,
    )
  })

  afterAll(() => {
    mock.restore()
  })

  it("注文削除ページ用のデータを取得できる", async () => {
    const result = await getOrderDeletePageData({ dbClient, order: { id: 1 } })
    expect(result.order).not.toBeNull()
    expect(result.order?.id).toBe(1)
    expect(result.order?.totalAmount).toBe(200)
  })

  it("注文が見つからない場合はnullを返す", async () => {
    spyOn(orderQueryRepository, "findOrderById").mockImplementationOnce(
      async () => null,
    )
    const result = await getOrderDeletePageData({
      dbClient,
      order: { id: 999 },
    })
    expect(result.order).toBeNull()
  })
})
