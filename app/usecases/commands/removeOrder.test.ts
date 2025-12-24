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
  deleteOrder: mock(async () => ({ ok: true as const, value: undefined })),
} satisfies Partial<typeof import("../repositories-provider").orderRepository>

const productRepository = {} satisfies Partial<
  typeof import("../repositories-provider").productRepository
>

mock.module("../repositories-provider", () => ({
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
    const res = await removeOrder({ dbClient, order: { id: 1 } })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.deleteOrder).toHaveBeenCalledTimes(1)
    expect(orderRepository.deleteOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { id: 1 },
        dbClient: txMock,
      }),
    )
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).toBe(undefined)
  })

  it("内部エラーが発生してもResultでエラーを返し内部のメッセージが漏洩しない", async () => {
    orderRepository.deleteOrder.mockImplementationOnce(async () => {
      throw new Error("unexpected internal error")
    })

    const res = await removeOrder({ dbClient, order: { id: 2 } })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    await expect(transactionSpy.mock.results[0].value).rejects.toThrow()
  })
})
