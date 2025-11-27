import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type Order from "../../domain/order/entities/order"
import type { DbClient, TransactionDbClient } from "../../libs/db/client"

const orderRepository = {
  updateOrder: mock(
    async ({ order }): Promise<Order | null> =>
      ({
        ...order,
        id: order.id,
        customerName: order.customerName ?? "Taro",
        createdAt: new Date(),
        updatedAt: order.updatedAt ?? new Date(),
        orderItems: [],
        totalAmount: 0,
        status: order.status ?? "pending",
      }) as Order,
  ),
} satisfies Partial<typeof import("../repositories-provider").orderRepository>

const productRepository = {} satisfies Partial<
  typeof import("../repositories-provider").productRepository
>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { setOrderDetails } = await import("./setOrderDetails")

describe("setOrderDetails", () => {
  let txMock: TransactionDbClient
  let dbClient: DbClient
  let transactionSpy: ReturnType<typeof spyOn>

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

  it("顧客名やステータスを更新できる", async () => {
    const updated = await setOrderDetails({
      dbClient,
      order: { id: 10, customerName: "Taro", status: "processing" },
    })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({
          id: 10,
          status: "processing",
          customerName: "Taro",
        }),
      }),
    )
    expect(updated).not.toBeNull()
    expect(updated?.id).toBe(10)
  })

  it("存在しない注文を更新しようとするとエラーを投げる", async () => {
    orderRepository.updateOrder.mockImplementationOnce(async () => null)

    await expect(
      setOrderDetails({ dbClient, order: { id: 9999, customerName: "XX" } }),
    ).rejects.toThrow("注文が見つかりません")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })
})
