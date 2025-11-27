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
  updateOrder: mock(async ({ order }) => ({
    ...order,
    id: order.id,
    comment: order.comment === undefined ? null : order.comment,
    customerName:
      order.customerName === undefined ? "Taro" : order.customerName,
    createdAt: new Date(),
    updatedAt: order.updatedAt,
    orderItems: [],
    totalAmount: 1000,
    status: order.status === undefined ? "pending" : order.status,
  })),
} satisfies Partial<typeof import("../repositories-provider").orderRepository>

const productRepository = {} satisfies Partial<
  typeof import("../repositories-provider").productRepository
>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { setOrderStatus } = await import("./setOrderStatus")

describe("setOrderStatus", () => {
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    orderRepository.updateOrder.mockClear()

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

  it("既存の注文のステータスを更新できる", async () => {
    const updated = await setOrderStatus({
      dbClient,
      order: { id: 10, status: "processing" },
    })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({ id: 10, status: "processing" }),
      }),
    )
    expect(updated).not.toBeNull()
    expect(updated?.id).toBe(10)
  })

  it("存在しない注文を更新しようとするとエラーを投げる", async () => {
    orderRepository.updateOrder.mockImplementationOnce(async () => null)

    await expect(
      setOrderStatus({
        dbClient,
        order: { id: 9999, status: "cancelled" },
      }),
    ).rejects.toThrow("注文が見つかりません")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })
})
