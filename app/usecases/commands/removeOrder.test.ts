import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type { DbClient, TransactionDbClient } from "../../libs/db/client"

const orderRepository = {
  deleteOrder: mock(async () => undefined),
} satisfies Partial<typeof import("../repositories").orderRepository>

const productRepository = {} satisfies Partial<
  typeof import("../repositories").productRepository
>

mock.module("../repositories", () => ({
  orderRepository,
  productRepository,
}))

const { removeOrder } = await import("./removeOrder")

describe("removeOrder", () => {
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    orderRepository.deleteOrder.mockClear()

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
    await removeOrder({ dbClient, order: { id: 1 } })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.deleteOrder).toHaveBeenCalledTimes(1)
    expect(orderRepository.deleteOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { id: 1 },
        dbClient: txMock,
      }),
    )
  })

  it("注文の削除に失敗した場合はエラーを投げる", async () => {
    const expected = new Error("delete failed")
    orderRepository.deleteOrder.mockImplementationOnce(async () => {
      throw expected
    })

    await expect(removeOrder({ dbClient, order: { id: 2 } })).rejects.toThrow(
      expected,
    )
    expect(transactionSpy).toHaveBeenCalledTimes(1)
  })
})
