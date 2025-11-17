import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import * as productCommandRepository from "../domain/product/repositories/productCommandRepository"
import type { DbClient, TransactionDbClient } from "../infrastructure/db/client"
import { removeProduct } from "./removeProduct"

describe("removeProduct", () => {
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    txMock = {} as TransactionDbClient
    const transactionHolder = {
      async transaction<T>(
        callback: (tx: TransactionDbClient) => Promise<T>,
      ): Promise<T> {
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

  it("商品を削除できる", async () => {
    const deleteProductSpy = spyOn(
      productCommandRepository,
      "deleteProduct",
    ).mockImplementation(async () => undefined)

    await removeProduct({ dbClient, product: { id: 1 } })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(deleteProductSpy).toHaveBeenCalledTimes(1)
    const callArg = deleteProductSpy.mock.calls[0]?.[0]
    expect(callArg?.product?.id).toBe(1)
    expect(callArg?.dbClient).toBe(txMock)
  })

  it("商品の削除に失敗した場合はエラーを投げる", async () => {
    const expectedError = new Error("delete failed")
    spyOn(productCommandRepository, "deleteProduct").mockImplementation(
      async () => {
        throw expectedError
      },
    )

    await expect(
      removeProduct({ dbClient, product: { id: 2 } }),
    ).rejects.toThrow(expectedError)
    expect(transactionSpy).toHaveBeenCalledTimes(1)
  })
})
