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
      ok: true as const,
      value: {
        ...params.order,
        id: params.order.id,
        customerName: params.order.customerName ?? "Taro",
        createdAt: new Date(),
        updatedAt: params.order.updatedAt ?? new Date(),
        orderItems: [],
        totalAmount: 0,
        status: params.order.status ?? "pending",
        comment: (params.order as { comment?: string | null }).comment ?? null,
      },
    }),
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

  it("顧客名やステータスを更新できる", async () => {
    const res = await setOrderDetails({
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
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value.id).toBe(10)
  })

  it("存在しない注文を更新しようとするとResultで失敗する", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async () => ({
      ok: false,
      message: "注文が見つかりません。",
    }))

    const res = await setOrderDetails({
      dbClient,
      order: { id: 9999, customerName: "XX" },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("注文が見つかりません。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(transactionSpy.mock.results[0].value).rejects.toThrow()
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })

  it("内部エラーが発生してもResultでエラーを返し内部のメッセージが漏洩しない", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async (_params) => {
      throw new Error("unexpected internal error")
    })

    const res = await setOrderDetails({
      dbClient,
      order: { id: 20, customerName: "Taro" },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(transactionSpy.mock.results[0].value).rejects.toThrow()
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })

  it("顧客名が50文字を超える場合はエラーを返す", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async () => ({
      ok: false,
      message: "顧客名は50文字以内である必要があります。",
    }))

    const res = await setOrderDetails({
      dbClient,
      order: { id: 30, customerName: "Taro" },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("顧客名は50文字以内である必要があります。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })

  it("コメントが250文字を超える場合はエラーを返す", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async () => ({
      ok: false,
      message: "コメントは250文字以内である必要があります。",
    }))

    const res = await setOrderDetails({
      dbClient,
      order: { id: 40, comment: "a".repeat(300) },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("コメントは250文字以内である必要があります。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })

  it("不正なステータスの場合はエラーを返す", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async () => ({
      ok: false,
      message:
        "注文の状態は'pending', 'processing', 'completed', 'cancelled'のいずれかである必要があります。",
    }))

    const res = await setOrderDetails({
      dbClient,
      order: { id: 41, status: "processing" },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe(
        "注文の状態は'pending', 'processing', 'completed', 'cancelled'のいずれかである必要があります。",
      )

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })

  it("ホワイトリストにないドメインエラーは汎用エラーにフォールバックする", async () => {
    orderRepository.updateOrder?.mockImplementationOnce(async () => ({
      ok: false,
      message: "注文項目は1種類以上20種類以下である必要があります。",
    }))

    const res = await setOrderDetails({ dbClient, order: { id: 50 } })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(transactionSpy.mock.results[0].value).rejects.toThrow()
    expect(orderRepository.updateOrder).toHaveBeenCalledTimes(1)
  })
})
