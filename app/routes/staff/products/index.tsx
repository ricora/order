import { createRoute } from "honox/factory"
import Layout from "../-components/layout"
import type { Product } from "./-types/product"

import Toast from "../../../components/ui/toast"
import {
  deleteToastCookie,
  getToastCookie,
  setToastCookie,
} from "../../../helpers/ui/toast"
import ProductCardView from "./-components/productCardView"
import ProductInfo from "./-components/productInfo"
import ProductRegister from "./-components/productRegister"
import ProductTableView from "./-components/productTableView"
import ViewModeToggle from "./-components/viewModeToggle"

// dummy product data
const dummyImage = "https://picsum.photos/200/200"
const products: Product[] = [
  {
    id: 1,
    name: "ハンバーガー",
    image: dummyImage,
    tags: ["メイン", "人気", "肉料理"],
    price: 800,
    stock: 15,
  },
  {
    id: 2,
    name: "フライドポテト",
    image: dummyImage,
    tags: ["サイド", "人気"],
    price: 300,
    stock: 3,
  },
  {
    id: 3,
    name: "コーラ",
    image: dummyImage,
    tags: ["ドリンク", "炭酸"],
    price: 200,
    stock: 0,
  },
  {
    id: 4,
    name: "チーズバーガー",
    image: dummyImage,
    tags: ["メイン", "チーズ", "肉料理"],
    price: 950,
    stock: 8,
  },
  {
    id: 5,
    name: "チキンナゲット",
    image: dummyImage,
    tags: ["サイド", "チキン"],
    price: 450,
    stock: 12,
  },
  {
    id: 6,
    name: "オレンジジュース",
    image: dummyImage,
    tags: ["ドリンク", "フルーツ"],
    price: 250,
    stock: 2,
  },
  {
    id: 7,
    name: "フィッシュバーガー",
    image: dummyImage,
    tags: ["メイン", "魚料理"],
    price: 750,
    stock: 6,
  },
  {
    id: 8,
    name: "アイスクリーム",
    image: dummyImage,
    tags: ["デザート", "冷たい"],
    price: 300,
    stock: 20,
  },
]

const tags = [
  "人気",
  "メイン",
  "サイド",
  "肉料理",
  "魚料理",
  "チーズ",
  "チキン",
  "ドリンク",
  "フルーツ",
  "炭酸",
  "デザート",
  "冷たい",
]

const totalProducts = products.length
const lowStockCount = products.filter((p) => p.stock <= 5 && p.stock > 0).length
const outOfStockCount = products.filter((p) => p.stock === 0).length
const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)

const productFormDataToProduct = (formData: FormData): Omit<Product, "id"> => {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("商品名は必須です")
  if (name.length > 100)
    throw new Error("商品名は100文字以内で入力してください")

  const image = String(formData.get("image") ?? "").trim()
  if (image && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(image)) {
    throw new Error(
      "画像URLが不正です（http(s)で始まり画像拡張子で終わる必要があります）",
    )
  }

  const price = Number(formData.get("price"))
  if (Number.isNaN(price) || price < 0 || !Number.isInteger(price)) {
    throw new Error("価格は0以上の整数で入力してください")
  }

  const stock = Number(formData.get("stock"))
  if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    throw new Error("在庫数は0以上の整数で入力してください")
  }

  const tags = (formData.getAll("tags") as string[])
    .map((t) => t.trim())
    .filter(Boolean)
  return {
    name,
    image,
    tags,
    price,
    stock,
  }
}

export const POST = createRoute(async (c) => {
  try {
    const formData = await c.req.formData()
    // @ts-expect-error
    const product = productFormDataToProduct(formData)
    // TODO: Implement product registration logic

    setToastCookie(c, "success", "商品を登録しました")
  } catch (e) {
    setToastCookie(c, "error", String(e))
  }
  return c.redirect(c.req.url)
})

export default createRoute((c) => {
  const url = new URL(c.req.url)
  const viewMode = c.req.query("view") === "card" ? "card" : "table"
  const search = url.search
  const { toastType, toastMessage } = getToastCookie(c)

  if (toastType || toastMessage) {
    deleteToastCookie(c)
  }

  return c.render(
    <Layout title={"商品管理"} description={"商品情報の登録や編集を行います。"}>
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toastMessage} type={toastType} />
        </div>
      )}
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <ProductInfo
            totalProducts={totalProducts}
            outOfStockCount={outOfStockCount}
            lowStockCount={lowStockCount}
            totalValue={totalValue}
          />
          <ProductRegister tags={tags} />
          <div className="bg-white rounded-lg border p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <span className="text-lg font-bold">商品一覧</span>
              <div className="flex justify-end">
                <ViewModeToggle viewMode={viewMode} search={search} />
              </div>
            </div>
            {viewMode === "table" ? (
              <ProductTableView products={products} />
            ) : (
              <ProductCardView products={products} />
            )}
          </div>
        </div>
      </div>
    </Layout>,
  )
})
