import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
  spyOn,
} from "bun:test"
import { MAX_STORE_PRODUCT_COUNT } from "../../domain/product/constants"
import type { Product } from "../../domain/product/entities"
import type { DbClient, TransactionDbClient } from "../../libs/db/client"

const mockProducts = [
  { id: 1, name: "A", tagIds: [], price: 100, stock: 5 },
  { id: 2, name: "B", tagIds: [], price: 200, stock: 2 },
] satisfies Product[]

type OrderRepository = typeof import("../repositories-provider").orderRepository
type MockOrderRepository = {
  [K in keyof OrderRepository]: Mock<OrderRepository[K]>
}

const orderRepository: Partial<MockOrderRepository> = {
  createOrder: mock(async ({ order }) => ({
    ok: true as const,
    value: { ...order, id: 123 },
  })),
} satisfies Partial<MockOrderRepository>

const productRepository = {
  findAllProductsByIds: mock(async () => ({
    ok: true as const,
    value: mockProducts,
  })),
  updateProduct: mock(async ({ product }) => {
    const orig = mockProducts.find((p) => p.id === product.id)
    if (!orig)
      return { ok: false as const, message: "商品が見つかりません。" as const }
    return {
      ok: true as const,
      value: {
        id: orig.id,
        name: orig.name,
        tagIds: orig.tagIds,
        price: orig.price,
        stock: product.stock ?? orig.stock,
      },
    }
  }),
} satisfies Partial<typeof import("../repositories-provider").productRepository>

mock.module("../repositories-provider", () => ({
  orderRepository,
  productRepository,
}))

const { registerOrder } = await import("./registerOrder")

describe("registerOrder", () => {
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
    orderRepository.createOrder?.mockClear()
    productRepository.findAllProductsByIds.mockClear()
    productRepository.updateProduct.mockClear()

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

  it("注文が正常に登録されたときに在庫が減る", async () => {
    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
      },
    })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(productRepository.findAllProductsByIds).toHaveBeenCalledTimes(1)
    expect(productRepository.updateProduct).toHaveBeenCalledTimes(2)
    expect(productRepository.updateProduct.mock.calls[0]?.[0]?.product).toEqual(
      expect.objectContaining({ id: 1, stock: 3 }),
    )
    expect(productRepository.updateProduct.mock.calls[1]?.[0]?.product).toEqual(
      expect.objectContaining({ id: 2, stock: 1 }),
    )
    expect(orderRepository.createOrder).toHaveBeenCalledTimes(1)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value.id).toBe(123)
  })

  it("在庫不足のときにエラーを返す", async () => {
    productRepository.findAllProductsByIds.mockImplementationOnce(async () => ({
      ok: true,
      value: [
        { id: 1, name: "A", image: null, tagIds: [], price: 100, stock: 5 },
        { id: 2, name: "B", image: null, tagIds: [], price: 200, stock: 0 },
      ],
    }))

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 1 },
        ],
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("注文の個数が在庫を上回っています。")
    expect(productRepository.updateProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.updateProduct.mock.calls[0]?.[0]?.product).toEqual(
      expect.objectContaining({ id: 1, stock: 4 }),
    )
    expect(orderRepository.createOrder).not.toHaveBeenCalled()
  })

  it("存在しない商品が含まれるときにエラーを返す", async () => {
    productRepository.findAllProductsByIds.mockImplementationOnce(async () => ({
      ok: true,
      value: [
        { id: 1, name: "A", image: null, tagIds: [], price: 100, stock: 5 },
      ],
    }))

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 1 },
        ],
      },
    })
    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("注文に存在しない商品が含まれています。")
    expect(productRepository.updateProduct).not.toHaveBeenCalled()
    expect(orderRepository.createOrder).not.toHaveBeenCalled()
  })

  it("findAllProductsByIdsに正しいページネーションパラメータを渡している", async () => {
    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 1 },
        ],
      },
    })

    expect(productRepository.findAllProductsByIds).toHaveBeenCalledTimes(1)
    expect(productRepository.findAllProductsByIds).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { offset: 0, limit: MAX_STORE_PRODUCT_COUNT },
      }),
    )
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).not.toBeNull()
  })

  it("createOrderで非ホワイトリストのドメインエラーは汎用エラーにフォールバックする", async () => {
    orderRepository.createOrder?.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "注文項目の単価は0以上である必要があります。",
    }))

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [{ productId: 1, quantity: 1 }],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
    expect(orderRepository.createOrder).toHaveBeenCalledTimes(1)
  })

  it("createOrderが例外を投げた場合は汎用エラーにフォールバックする", async () => {
    orderRepository.createOrder?.mockImplementationOnce(async () => {
      throw new Error("unexpected")
    })

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [{ productId: 1, quantity: 1 }],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
    expect(orderRepository.createOrder).toHaveBeenCalledTimes(1)
  })

  it("findAllProductsByIdsが失敗した場合は汎用エラーを返す", async () => {
    productRepository.findAllProductsByIds.mockImplementationOnce(
      async () =>
        ({
          ok: false as const,
          message: "db error",
        }) as unknown as ReturnType<
          typeof productRepository.findAllProductsByIds
        >,
    )

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [{ productId: 1, quantity: 1 }],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
    expect(productRepository.updateProduct).not.toHaveBeenCalled()
    expect(orderRepository.createOrder).not.toHaveBeenCalled()
  })

  it("updateProductが失敗した場合は汎用エラーを返す", async () => {
    productRepository.updateProduct.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "商品が見つかりません。" as const,
    }))

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [{ productId: 1, quantity: 1 }],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.message).toBe("エラーが発生しました。")
    expect(orderRepository.createOrder).not.toHaveBeenCalled()
  })

  it("createOrderの顧客名エラーはそのまま返る", async () => {
    orderRepository.createOrder?.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "顧客名は50文字以内である必要があります。",
    }))

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [{ productId: 1, quantity: 1 }],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("顧客名は50文字以内である必要があります。")
  })

  it("createOrderのコメント長エラーはそのまま返る", async () => {
    orderRepository.createOrder?.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "コメントは250文字以内である必要があります。",
    }))

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [{ productId: 1, quantity: 1 }],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("コメントは250文字以内である必要があります。")
  })

  it("createOrderの注文項目数エラーはそのまま返る", async () => {
    orderRepository.createOrder?.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "注文項目は1種類以上20種類以下である必要があります。",
    }))

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [{ productId: 1, quantity: 1 }],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe(
        "注文項目は1種類以上20種類以下である必要があります。",
      )
  })

  it("createOrderの注文項目数量エラーはそのまま返る", async () => {
    orderRepository.createOrder?.mockImplementationOnce(async () => ({
      ok: false as const,
      message: "注文項目の数量は1以上である必要があります。",
    }))

    const res = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        comment: null,
        orderItems: [{ productId: 1, quantity: 1 }],
      },
    })

    expect(res.ok).toBe(false)
    if (!res.ok)
      expect(res.message).toBe("注文項目の数量は1以上である必要があります。")
  })
})
