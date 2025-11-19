import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type Order from "../domain/order/entities/order"
import * as orderCommandRepository from "../domain/order/repositories/orderCommandRepository"
import type { DbClient, TransactionDbClient } from "../infrastructure/db/client"
import { setOrderDetails } from "./setOrderDetails"

describe("setOrderDetails", () => {
  let txMock: TransactionDbClient
  let dbClient: DbClient
  let transactionSpy: ReturnType<typeof spyOn>
  let updateOrderSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    txMock = {} as TransactionDbClient
    const transactionHolder = {
      async transaction<T>(callback: (tx: TransactionDbClient) => Promise<T>) {
        return callback(txMock)
      },
    }
    dbClient = transactionHolder as unknown as DbClient
    transactionSpy = spyOn(transactionHolder, "transaction").mockImplementation(
      async <T>(callback: (tx: TransactionDbClient) => Promise<T>) =>
        callback(txMock),
    )

    updateOrderSpy = spyOn(
      orderCommandRepository,
      "updateOrder",
    ).mockImplementation(
      async ({ order }) =>
        ({
          ...order,
          id: order.id,
          customerName: order.customerName ?? "Taro",
          createdAt: new Date(),
          updatedAt: order.updatedAt ?? new Date(),
          orderItems: [],
          totalAmount: 0,
          status: order.status ?? "pending",
        }) as unknown as Order,
    )
  })

  afterEach(() => {
    mock.restore()
  })

  it("顧客名やステータスを更新できる", async () => {
    const updated = await setOrderDetails({
      dbClient,
      order: { id: 10, customerName: "Taro", status: "processing" },
    })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(updateOrderSpy).toHaveBeenCalledTimes(1)
    expect(updateOrderSpy.mock.calls[0][0].order).toEqual(
      expect.objectContaining({
        id: 10,
        status: "processing",
        customerName: "Taro",
      }),
    )
    expect(updated).not.toBeNull()
    expect(updated?.id).toBe(10)
  })

  it("存在しない注文を更新しようとするとエラーを投げる", async () => {
    updateOrderSpy.mockImplementationOnce(async () => null)

    await expect(
      setOrderDetails({ dbClient, order: { id: 9999, customerName: "XX" } }),
    ).rejects.toThrow("注文が見つかりません")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(updateOrderSpy).toHaveBeenCalledTimes(1)
  })
})
