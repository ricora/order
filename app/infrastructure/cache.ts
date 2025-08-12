import type Product from "../domain/product/entities/product"
import type ProductTag from "../domain/product/entities/productTag"

const dummyImage = "https://picsum.photos/200/200"

export const product: Product[] = [
  {
    id: 1,
    name: "ハンバーガー",
    image: dummyImage,
    tagIds: [1, 2, 3], // メイン, 人気, 肉料理
    price: 800,
    stock: 15,
  },
  {
    id: 2,
    name: "フライドポテト",
    image: dummyImage,
    tagIds: [4, 2], // サイド, 人気
    price: 300,
    stock: 3,
  },
  {
    id: 3,
    name: "コーラ",
    image: dummyImage,
    tagIds: [5, 6], // ドリンク, 炭酸
    price: 200,
    stock: 0,
  },
  {
    id: 4,
    name: "チーズバーガー",
    image: dummyImage,
    tagIds: [1, 7, 3], // メイン, チーズ, 肉料理
    price: 950,
    stock: 8,
  },
  {
    id: 5,
    name: "チキンナゲット",
    image: dummyImage,
    tagIds: [4, 8], // サイド, チキン
    price: 450,
    stock: 12,
  },
  {
    id: 6,
    name: "オレンジジュース",
    image: dummyImage,
    tagIds: [5, 9], // ドリンク, フルーツ
    price: 250,
    stock: 2,
  },
  {
    id: 7,
    name: "フィッシュバーガー",
    image: dummyImage,
    tagIds: [1, 10], // メイン, 魚料理
    price: 750,
    stock: 6,
  },
  {
    id: 8,
    name: "アイスクリーム",
    image: dummyImage,
    tagIds: [11, 12], // デザート, 冷たい
    price: 300,
    stock: 20,
  },
]

export const productTags: ProductTag[] = [
  { id: 1, name: "メイン" },
  { id: 2, name: "人気" },
  { id: 3, name: "肉料理" },
  { id: 4, name: "サイド" },
  { id: 5, name: "ドリンク" },
  { id: 6, name: "炭酸" },
  { id: 7, name: "チーズ" },
  { id: 8, name: "チキン" },
  { id: 9, name: "フルーツ" },
  { id: 10, name: "魚料理" },
  { id: 11, name: "デザート" },
  { id: 12, name: "冷たい" },
]
