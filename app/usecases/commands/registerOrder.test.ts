import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import { MAX_STORE_PRODUCT_COUNT } from "../../domain/product/constants"
import type Product from "../../domain/product/entities/product"
import type { DbClient, TransactionDbClient } from "../../libs/db/client"

const mockProducts = [
  { id: 1, name: "A", tagIds: [], price: 100, stock: 5 },
  { id: 2, name: "B", tagIds: [], price: 200, stock: 2 },
] satisfies Product[]

const orderRepository = {
  createOrder: mock(async ({ order }) => ({
    ...order,
    id: 123,
  })),
} satisfies Partial<typeof import("../repositories-provider").orderRepository>

const productRepository = {
  findAllProductsByIds: mock(async () => mockProducts),
  updateProduct: mock(async ({ product }) => {
    const orig = mockProducts.find((p) => p.id === product.id)
    if (!orig) throw new Error(`mock product not found: ${product.id}`)
    return {
      id: orig.id,
      name: orig.name,
      tagIds: orig.tagIds,
      price: orig.price,
      stock: product.stock ?? orig.stock,
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
    orderRepository.createOrder.mockClear()
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
    const created = await registerOrder({
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
    expect(created).not.toBeNull()
    expect(created?.id).toBe(123)
  })

  it("在庫不足のときにエラーを投げる", async () => {
    productRepository.findAllProductsByIds.mockImplementationOnce(async () => [
      { id: 1, name: "A", image: null, tagIds: [], price: 100, stock: 5 },
      { id: 2, name: "B", image: null, tagIds: [], price: 200, stock: 0 },
    ])

    await expect(
      registerOrder({
        dbClient,
        order: {
          customerName: "Taro",
          comment: null,
          orderItems: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 1 },
          ],
        },
      }),
    ).rejects.toThrow("注文の個数が在庫を上回っています")
    expect(productRepository.updateProduct).toHaveBeenCalledTimes(1)
    expect(productRepository.updateProduct.mock.calls[0]?.[0]?.product).toEqual(
      expect.objectContaining({ id: 1, stock: 4 }),
    )
    expect(orderRepository.createOrder).not.toHaveBeenCalled()
  })

  it("存在しない商品が含まれるときにエラーを投げる", async () => {
    productRepository.findAllProductsByIds.mockImplementationOnce(async () => [
      { id: 1, name: "A", image: null, tagIds: [], price: 100, stock: 5 },
    ])
    await expect(
      registerOrder({
        dbClient,
        order: {
          customerName: "Taro",
          comment: null,
          orderItems: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 1 },
          ],
        },
      }),
    ).rejects.toThrow("注文に存在しない商品が含まれています")
    expect(productRepository.updateProduct).not.toHaveBeenCalled()
    expect(orderRepository.createOrder).not.toHaveBeenCalled()
  })

  it("findAllProductsByIdsに正しいページネーションパラメータを渡している", async () => {
    await registerOrder({
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
  })
})
