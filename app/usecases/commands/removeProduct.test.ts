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

const orderRepository = {} satisfies Partial<
  typeof import("../repositories-provider").orderRepository
>

const productRepository = {
  deleteProduct: mock(async () => ({ ok: true as const, value: undefined })),
} satisfies Partial<typeof import("../repositories-provider").productRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { removeProduct } = await import("./removeProduct")

describe("removeProduct", () => {
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    productRepository.deleteProduct.mockClear()

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
    const res = await removeProduct({ dbClient, product: { id: 1 } })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(productRepository.deleteProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.deleteProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        product: { id: 1 },
        dbClient: txMock,
      }),
    )
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).toBe(undefined)
  })

  it("内部エラーが発生してもResultでエラーを返し内部メッセージが漏洩しない", async () => {
    productRepository.deleteProduct.mockImplementationOnce(async () => {
      throw new Error("unexpected internal error")
    })

    const res = await removeProduct({ dbClient, product: { id: 2 } })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
  })
})
