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
  typeof import("../repositories").orderRepository
>

const productRepository = {
  deleteProduct: mock(async () => undefined),
} satisfies Partial<typeof import("../repositories").productRepository>

mock.module("../repositories", () => ({
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
    await removeProduct({ dbClient, product: { id: 1 } })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(productRepository.deleteProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.deleteProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        product: { id: 1 },
        dbClient: txMock,
      }),
    )
  })

  it("商品の削除に失敗した場合はエラーを投げる", async () => {
    const expectedError = new Error("delete failed")
    productRepository.deleteProduct.mockImplementationOnce(async () => {
      throw expectedError
    })

    await expect(
      removeProduct({ dbClient, product: { id: 2 } }),
    ).rejects.toThrow(expectedError)
    expect(transactionSpy).toHaveBeenCalledTimes(1)
  })
})
