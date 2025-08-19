import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"
import type Product from "../domain/product/entities/product"
import type ProductTag from "../domain/product/entities/productTag"
import * as productCommandRepository from "../domain/product/repositories/productCommandRepository"
import * as productTagCommandRepository from "../domain/product/repositories/productTagCommandRepository"
import * as productTagQueryRepository from "../domain/product/repositories/productTagQueryRepository"
import { registerProduct } from "./registerProduct"

const mockTags: ProductTag[] = [
  { id: 1, name: "人気" },
  { id: 2, name: "メイン" },
]

describe("registerProduct", () => {
  let createProductSpy: ReturnType<typeof spyOn>
  let createProductTagSpy: ReturnType<typeof spyOn>
  let findAllProductTagsSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    findAllProductTagsSpy = spyOn(
      productTagQueryRepository,
      "findAllProductTags",
    ).mockImplementation(async () => mockTags)
    createProductTagSpy = spyOn(
      productTagCommandRepository,
      "createProductTag",
    ).mockImplementation(async ({ name }) => ({ id: 3, name }))
    createProductSpy = spyOn(
      productCommandRepository,
      "createProduct",
    ).mockImplementation(
      async (params) =>
        ({
          ...params,
          id: 99,
        }) as Product,
    )
  })
  afterEach(() => {
    mock.restore()
  })

  it("既存タグのみで商品を登録できる", async () => {
    await registerProduct({
      name: "新商品",
      image: "https://example.com/new.png",
      tags: ["人気", "メイン"],
      price: 500,
      stock: 20,
    })
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(createProductTagSpy).not.toHaveBeenCalled()
    expect(createProductSpy).toHaveBeenCalledTimes(1)
    expect(createProductSpy.mock.calls[0][0].tagIds).toEqual([1, 2])
  })

  it("新規タグを含めて商品を登録できる", async () => {
    await registerProduct({
      name: "新商品2",
      image: "https://example.com/new2.png",
      tags: ["人気", "新規タグ"],
      price: 800,
      stock: 5,
    })
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(createProductTagSpy).toHaveBeenCalledWith({ name: "新規タグ" })
    expect(createProductSpy).toHaveBeenCalledTimes(1)
    expect(createProductSpy.mock.calls[0][0].tagIds).toEqual([1, 3])
  })

  it("タグが空や空白のみの場合は無視される", async () => {
    await registerProduct({
      name: "空タグ商品",
      image: "https://example.com/empty.png",
      tags: ["", "   "],
      price: 100,
      stock: 1,
    })
    expect(findAllProductTagsSpy).toHaveBeenCalledTimes(1)
    expect(createProductTagSpy).toHaveBeenCalledTimes(0)
    expect(createProductSpy).toHaveBeenCalledTimes(1)
    expect(createProductSpy.mock.calls[0][0].tagIds).toEqual([])
  })

  it("商品作成で例外が発生した場合はエラーを投げる", async () => {
    createProductSpy.mockImplementationOnce(async () => {
      throw new Error("DB error")
    })
    await expect(
      registerProduct({
        name: "失敗商品",
        image: "https://example.com/fail.png",
        tags: ["人気"],
        price: 100,
        stock: 1,
      }),
    ).rejects.toThrow("商品の作成に失敗しました")
  })
})
