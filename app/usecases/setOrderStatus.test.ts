import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import * as orderCommandRepository from "../domain/order/repositories/orderCommandRepository"
import type { DbClient, TransactionDbClient } from "../infrastructure/db/client"
import { setOrderStatus } from "./setOrderStatus"

describe("setOrderStatus", () => {
  let updateOrderSpy: ReturnType<typeof spyOn>
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

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
    ).mockImplementation(async ({ order }) => ({
      ...order,
      id: order.id,
      customerName:
        order.customerName === undefined ? "Taro" : order.customerName,
      createdAt: new Date(),
      updatedAt: order.updatedAt,
      orderItems: [],
      totalAmount: 1000,
      status: order.status === undefined ? "pending" : order.status,
    }))
  })

  afterEach(() => {
    mock.restore()
  })

  it("既存の注文のステータスを更新できる", async () => {
    const updated = await setOrderStatus({
      dbClient,
      order: { id: 10, status: "processing" },
    })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(updateOrderSpy).toHaveBeenCalledTimes(1)
    expect(updateOrderSpy.mock.calls[0][0].order).toEqual(
      expect.objectContaining({ id: 10, status: "processing" }),
    )
    expect(updated).not.toBeNull()
    expect(updated?.id).toBe(10)
  })

  it("存在しない注文を更新しようとするとエラーを投げる", async () => {
    updateOrderSpy.mockImplementationOnce(async () => null)

    await expect(
      setOrderStatus({
        dbClient,
        order: { id: 9999, status: "cancelled" },
      }),
    ).rejects.toThrow("注文が見つかりません")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(updateOrderSpy).toHaveBeenCalledTimes(1)
  })
})
