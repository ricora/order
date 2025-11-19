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
import { removeOrder } from "./removeOrder"

describe("removeOrder", () => {
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
  })

  afterEach(() => {
    mock.restore()
  })

  it("注文を削除できる", async () => {
    const deleteOrderSpy = spyOn(
      orderCommandRepository,
      "deleteOrder",
    ).mockImplementation(async () => undefined)

    await removeOrder({ dbClient, order: { id: 1 } })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(deleteOrderSpy).toHaveBeenCalledTimes(1)
    const callArg = deleteOrderSpy.mock.calls[0]?.[0]
    expect(callArg?.order?.id).toBe(1)
    expect(callArg?.dbClient).toBe(txMock)
  })

  it("注文の削除に失敗した場合はエラーを投げる", async () => {
    const expected = new Error("delete failed")
    spyOn(orderCommandRepository, "deleteOrder").mockImplementation(
      async () => {
        throw expected
      },
    )

    await expect(removeOrder({ dbClient, order: { id: 2 } })).rejects.toThrow(
      expected,
    )
    expect(transactionSpy).toHaveBeenCalledTimes(1)
  })
})
