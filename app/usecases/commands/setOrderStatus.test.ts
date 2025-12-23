import type { Mock } from "bun:test"
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

type OrderRepository = typeof import("../repositories-provider").orderRepository
type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock<OrderRepository[K]>
}

const orderRepository: Partial<MockOrderRepository> = {
  updateOrder: mock(
    async (params: Parameters<OrderRepository["updateOrder"]>[0]) => ({
      ok: true,
      value: {
        ...params.order,
        id: params.order.id,
        comment:
          params.order.comment === undefined ? null : params.order.comment,
        customerName:
          params.order.customerName === undefined
            ? "Taro"
            : params.order.customerName,
        createdAt: new Date(),
        updatedAt: params.order.updatedAt,
        orderItems: [],
        totalAmount: 1000,
        status:
          params.order.status === undefined ? "pending" : params.order.status,
      },
    }),
  ),
}
const productRepository = {} satisfies Partial<
  typeof import("../repositories-provider").productRepository
>

mock.module("../repositories-provider", () => ({
  orderRepository: orderRepository,
  productRepository: productRepository,
}))

const { setOrderStatus } = await import("./setOrderStatus")

describe("setOrderStatus", () => {
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    orderRepository.updateOrder?.mockClear()

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
    const result = await setOrderStatus({
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
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.id).toBe(10)
  })

  it("存在しない注文を更新しようとするとResultで失敗を返す", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async (_params) => ({
      ok: false,
      message: "注文が見つかりません。",
    }))

    const res = await setOrderStatus({
      dbClient,
      order: { id: 9999, status: "cancelled" },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("注文が見つかりません。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    await expect(transactionSpy.mock.results[0].value).rejects.toThrow()
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })

  it("内部エラーが発生したときに汎用エラーが返りトランザクションがrollbackされる", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async () => {
      throw new Error("unexpected internal error")
    })

    const res = await setOrderStatus({
      dbClient,
      order: { id: 20, status: "processing" },
    })

    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    await expect(transactionSpy.mock.results[0].value).rejects.toThrow()
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })

  it("指定していないドメインのバリデーションエラーが漏洩しない", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async (_params) => ({
      ok: false,
      message: "顧客名は50文字以内である必要があります。",
    }))

    const res = await setOrderStatus({
      dbClient,
      order: { id: 30, status: "processing" },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    await expect(transactionSpy.mock.results[0].value).rejects.toThrow()
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })
})
