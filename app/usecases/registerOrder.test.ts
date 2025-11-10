import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import * as orderCommandRepository from "../domain/order/repositories/orderCommandRepository"
import * as productCommandRepository from "../domain/product/repositories/productCommandRepository"
import * as productQueryRepository from "../domain/product/repositories/productQueryRepository"
import type { DbClient, TransactionDbClient } from "../infrastructure/db/client"
import { registerOrder } from "./registerOrder"

const mockProducts = [
  { id: 1, name: "A", image: null, tagIds: [], price: 100, stock: 5 },
  { id: 2, name: "B", image: null, tagIds: [], price: 200, stock: 2 },
]

describe("registerOrder", () => {
  let findAllProductsByIdsSpy: ReturnType<typeof spyOn>
  let updateProductSpy: ReturnType<typeof spyOn>
  let createOrderSpy: ReturnType<typeof spyOn>
  let transactionSpy: ReturnType<typeof spyOn>
  let txMock: TransactionDbClient
  let dbClient: DbClient

  beforeEach(() => {
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

    findAllProductsByIdsSpy = spyOn(
      productQueryRepository,
      "findAllProductsByIds",
    ).mockImplementation(async () => mockProducts)

    updateProductSpy = spyOn(
      productCommandRepository,
      "updateProduct",
    ).mockImplementation(async ({ product }) => {
      const orig = mockProducts.find((p) => p.id === product.id)
      if (!orig) throw new Error(`mock product not found: ${product.id}`)
      return {
        id: orig.id,
        name: orig.name,
        image: orig.image,
        tagIds: orig.tagIds,
        price: orig.price,
        stock: product.stock ?? orig.stock,
      }
    })

    createOrderSpy = spyOn(
      orderCommandRepository,
      "createOrder",
    ).mockImplementation(async ({ order }) => ({
      ...order,
      id: 123,
    }))
  })

  afterEach(() => {
    mock.restore()
  })

  it("注文が正常に登録されたときに在庫が減る", async () => {
    const created = await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        orderItems: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
      },
    })

    expect(transactionSpy).toHaveBeenCalledTimes(1)
    expect(findAllProductsByIdsSpy).toHaveBeenCalledTimes(1)
    expect(updateProductSpy).toHaveBeenCalledTimes(2)
    expect(updateProductSpy.mock.calls[0][0].product).toEqual(
      expect.objectContaining({ id: 1, stock: 3 }),
    )
    expect(updateProductSpy.mock.calls[1][0].product).toEqual(
      expect.objectContaining({ id: 2, stock: 1 }),
    )
    expect(createOrderSpy).toHaveBeenCalledTimes(1)
    expect(created).not.toBeNull()
    expect(created?.id).toBe(123)
  })

  it("在庫不足のときにエラーを投げる", async () => {
    findAllProductsByIdsSpy.mockImplementationOnce(async () => [
      { id: 1, name: "A", image: null, tagIds: [], price: 100, stock: 5 },
      { id: 2, name: "B", image: null, tagIds: [], price: 200, stock: 0 },
    ])

    await expect(
      registerOrder({
        dbClient,
        order: {
          customerName: "Taro",
          orderItems: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 1 },
          ],
        },
      }),
    ).rejects.toThrow("注文の個数が在庫を上回っています")
    expect(updateProductSpy).toHaveBeenCalledTimes(1)
    expect(updateProductSpy.mock.calls[0][0].product).toEqual(
      expect.objectContaining({ id: 1, stock: 4 }),
    )
    expect(createOrderSpy).not.toHaveBeenCalled()
  })

  it("存在しない商品が含まれるときにエラーを投げる", async () => {
    findAllProductsByIdsSpy.mockImplementationOnce(async () => [
      { id: 1, name: "A", image: null, tagIds: [], price: 100, stock: 5 },
    ])
    await expect(
      registerOrder({
        dbClient,
        order: {
          customerName: "Taro",
          orderItems: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 1 },
          ],
        },
      }),
    ).rejects.toThrow("注文に存在しない商品が含まれています")
    expect(updateProductSpy).not.toHaveBeenCalled()
    expect(createOrderSpy).not.toHaveBeenCalled()
  })

  it("findAllProductsByIdsに正しいページネーションパラメータを渡している", async () => {
    await registerOrder({
      dbClient,
      order: {
        customerName: "Taro",
        orderItems: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 1 },
        ],
      },
    })

    expect(findAllProductsByIdsSpy).toHaveBeenCalledTimes(1)
    expect(findAllProductsByIdsSpy.mock.calls[0][0].pagination).toEqual({
      offset: 0,
      limit: 1000,
    })
  })
})
