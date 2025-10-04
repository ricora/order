import { createRoute } from "honox/factory"
import type Product from "../../../../domain/product/entities/product"
import { setToastCookie } from "../../../../helpers/ui/toast"
import Layout from "../../-components/layout"
import OrderRegister from "./-components/$orderRegister"

// TODO: ユースケース関数の実装時に置き換える
export type ProductForUI = Omit<Product, "image" | "tagIds"> & {
  image: string
  tags: string[]
}

type OrderFormItem = {
  productId: number
  quantity: number
}

type OrderFormParams = {
  customerName: string | null
  items: OrderFormItem[]
}

const orderFormDataToOrderParams = (formData: FormData): OrderFormParams => {
  const productIdEntries = formData.getAll("items[][productId]")
  const quantityEntries = formData.getAll("items[][quantity]")

  if (productIdEntries.length !== quantityEntries.length) {
    throw new Error("数量と商品IDの数が一致していません")
  }

  const items: OrderFormItem[] = productIdEntries
    .map((productId, index) => {
      const quantity = Number(quantityEntries[index])
      const parsedProductId = Number(productId)

      if (Number.isNaN(parsedProductId)) {
        throw new Error("商品IDが不正です")
      }

      if (
        Number.isNaN(quantity) ||
        quantity < 1 ||
        !Number.isInteger(quantity)
      ) {
        throw new Error("数量は1以上の整数で入力してください")
      }

      return {
        productId: parsedProductId,
        quantity,
      }
    })
    .filter((item) => item.quantity > 0)

  if (items.length === 0) {
    throw new Error("注文する商品を1件以上選択してください")
  }

  const customerName = String(formData.get("customerName") ?? "").trim()

  return {
    customerName: customerName.length > 0 ? customerName : null,
    items,
  }
}

const dummyImageUrl = "https://picsum.photos/200/200"

const PRODUCTS: ProductForUI[] = [
  {
    id: 1,
    name: "タグの多いコーヒー",
    image: dummyImageUrl,
    tags: [
      "ドリンク",
      "ホット",
      "季節",
      "デザート",
      "カフェイン",
      "ブラック",
      "ミルク",
      "アイス",
      "ラテ",
      "エスプレッソ",
      "カフェモカ",
      "カプチーノ",
      "フラットホワイト",
      "アメリカーノ",
      "マキアート",
      "コールドブリュー",
      "ナイトロコーヒー",
      "デカフェ",
      "オーガニック",
      "スペシャルティ",
      "シングルオリジン",
      "ブレンド",
      "フレンチプレス",
      "ドリップ",
      "エアロプレス",
      "サイフォン",
      "コーヒープレス",
      "インスタント",
      "カフェ",
      "カフェラテ",
      "アイスコーヒー",
      "ホットコーヒー",
      "エスプレッソショット",
      "カフェインレス",
      "デカフェコーヒー",
      "オーガニックコーヒー",
      "スペシャルティコーヒー",
      "シングルオリジンコーヒー",
      "ブレンドコーヒー",
      "フレンチプレスコーヒー",
      "ドリップコーヒー",
      "エアロプレスコーヒー",
      "サイフォンコーヒー",
      "コーヒープレスコーヒー",
      "インスタントコーヒー",
    ],
    price: 300,
    stock: 25,
  },
  {
    id: 2,
    name: "カレー",
    image: dummyImageUrl,
    tags: ["フード", "ビーフ"],
    price: 900,
    stock: 12,
  },
  {
    id: 3,
    name: "サラダ",
    image: dummyImageUrl,
    tags: ["サイド", "季節"],
    price: 400,
    stock: 6,
  },
  {
    id: 4,
    name: "アイス",
    image: dummyImageUrl,
    tags: ["デザート"],
    price: 200,
    stock: 40,
  },
  {
    id: 5,
    name: "スープ",
    image: dummyImageUrl,
    tags: ["サイド"],
    price: 350,
    stock: 8,
  },
  {
    id: 6,
    name: "サンドイッチ",
    image: dummyImageUrl,
    tags: ["フード"],
    price: 650,
    stock: 4,
  },
  {
    id: 7,
    name: "ジュース",
    image: dummyImageUrl,
    tags: ["ドリンク"],
    price: 250,
    stock: 30,
  },
  {
    id: 8,
    name: "ケーキ",
    image: dummyImageUrl,
    tags: ["デザート"],
    price: 500,
    stock: 3,
  },
  {
    id: 9,
    name: "ハンバーガー",
    image: dummyImageUrl,
    tags: ["フード", "ビーフ"],
    price: 800,
    stock: 15,
  },
  {
    id: 10,
    name: "オムライス",
    image: dummyImageUrl,
    tags: ["フード"],
    price: 750,
    stock: 9,
  },
  {
    id: 11,
    name: "パンケーキ",
    image: dummyImageUrl,
    tags: ["デザート"],
    price: 450,
    stock: 7,
  },
  {
    id: 12,
    name: "ミルクシェイク",
    image: dummyImageUrl,
    tags: ["ドリンク", "デザート"],
    price: 380,
    stock: 20,
  },
  {
    id: 13,
    name: "ポテト",
    image: dummyImageUrl,
    tags: ["サイド"],
    price: 300,
    stock: 25,
  },
  {
    id: 14,
    name: "グリーンスムージー",
    image: dummyImageUrl,
    tags: ["ドリンク", "季節"],
    price: 420,
    stock: 10,
  },
  {
    id: 15,
    name: "チーズケーキ",
    image: dummyImageUrl,
    tags: ["デザート"],
    price: 520,
    stock: 5,
  },
  {
    id: 16,
    name: "ビーフステーキ",
    image: dummyImageUrl,
    tags: ["フード", "ビーフ"],
    price: 1800,
    stock: 6,
  },
  {
    id: 17,
    name: "シーザーサラダ",
    image: dummyImageUrl,
    tags: ["サイド"],
    price: 600,
    stock: 11,
  },
  {
    id: 18,
    name: "抹茶アイス",
    image: dummyImageUrl,
    tags: ["デザート", "季節"],
    price: 260,
    stock: 12,
  },
  {
    id: 19,
    name: "ホットチョコレート",
    image: dummyImageUrl,
    tags: ["ドリンク"],
    price: 350,
    stock: 18,
  },
  {
    id: 20,
    name: "照り焼きチキン",
    image: dummyImageUrl,
    tags: ["フード"],
    price: 950,
    stock: 8,
  },
  {
    id: 21,
    name: "カプレーゼ",
    image: dummyImageUrl,
    tags: ["サイド"],
    price: 480,
    stock: 14,
  },
  {
    id: 22,
    name: "エビフライ",
    image: dummyImageUrl,
    tags: ["フード", "シーフード"],
    price: 980,
    stock: 6,
  },
  {
    id: 23,
    name: "オレンジジュース",
    image: dummyImageUrl,
    tags: ["ドリンク"],
    price: 280,
    stock: 22,
  },
  {
    id: 24,
    name: "ベリーベリースムージー",
    image: dummyImageUrl,
    tags: ["ドリンク", "デザート", "季節"],
    price: 430,
    stock: 7,
  },
  {
    id: 25,
    name: "照り焼きバーガー",
    image: dummyImageUrl,
    tags: ["フード"],
    price: 850,
    stock: 5,
  },
  {
    id: 26,
    name: "グラタン",
    image: dummyImageUrl,
    tags: ["フード", "季節"],
    price: 720,
    stock: 9,
  },
  {
    id: 27,
    name: "フルーツサラダ",
    image: dummyImageUrl,
    tags: ["サイド", "デザート"],
    price: 520,
    stock: 13,
  },
  {
    id: 28,
    name: "アイスコーヒー",
    image: dummyImageUrl,
    tags: ["ドリンク"],
    price: 300,
    stock: 20,
  },
  {
    id: 29,
    name: "クラムチャウダー",
    image: dummyImageUrl,
    tags: ["サイド", "シーフード"],
    price: 560,
    stock: 4,
  },
  {
    id: 30,
    name: "ベーグル",
    image: dummyImageUrl,
    tags: ["フード"],
    price: 320,
    stock: 16,
  },
]

export const POST = createRoute(async (c) => {
  try {
    const formData = await c.req.formData()
    const order = orderFormDataToOrderParams(formData)
    console.log(order)
    //await registerOrder({ dbClient: c.get("dbClient"), order })

    setToastCookie(c, "success", "注文を登録しました")
  } catch (e) {
    setToastCookie(c, "error", String(e))
  }
  return c.redirect(c.req.url)
})

export default createRoute(async (c) => {
  return c.render(
    <Layout title={"注文登録"} description={"注文情報の登録を行います。"}>
      <div className="rounded-lg border bg-bg p-6">
        <h2 className="mb-4 font-bold text-lg">注文登録</h2>
        <OrderRegister products={PRODUCTS} />
      </div>
    </Layout>,
  )
})
