import { useState } from "react"
import { Button } from "@/shadcn-ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shadcn-ui/components/card"
import { Plus, Package, AlertTriangle, TrendingUp } from "lucide-react"
import type { Product, ProductFormData } from "../-lib/product"
import { ProductForm } from "../-components/$product-form"
import { ProductTableView } from "../-components/$product-table-view"
import { createProductColumns } from "../-components/$product-columns"
import { ProductCardView } from "../-components/$product-card-view"
import { ViewModeToggle } from "../-components/$view-mode-toggle"

// サンプルデータ
const initialProducts: Product[] = [
  {
    id: 1,
    name: "ハンバーガー",
    image: "/placeholder.svg?height=200&width=200",
    tags: ["メイン", "人気", "肉料理"],
    price: 800,
    stock: 15,
  },
  {
    id: 2,
    name: "フライドポテト",
    image: "/placeholder.svg?height=200&width=200",
    tags: ["サイド", "人気"],
    price: 300,
    stock: 3,
  },
  {
    id: 3,
    name: "コーラ",
    image: "/placeholder.svg?height=200&width=200",
    tags: ["ドリンク", "炭酸"],
    price: 200,
    stock: 0,
  },
  {
    id: 4,
    name: "チーズバーガー",
    image: "/placeholder.svg?height=200&width=200",
    tags: ["メイン", "チーズ", "肉料理"],
    price: 950,
    stock: 8,
  },
  {
    id: 5,
    name: "チキンナゲット",
    image: "/placeholder.svg?height=200&width=200",
    tags: ["サイド", "チキン"],
    price: 450,
    stock: 12,
  },
  {
    id: 6,
    name: "オレンジジュース",
    image: "/placeholder.svg?height=200&width=200",
    tags: ["ドリンク", "フルーツ"],
    price: 250,
    stock: 2,
  },
  {
    id: 7,
    name: "フィッシュバーガー",
    image: "/placeholder.svg?height=200&width=200",
    tags: ["メイン", "魚料理"],
    price: 750,
    stock: 6,
  },
  {
    id: 8,
    name: "アイスクリーム",
    image: "/placeholder.svg?height=200&width=200",
    tags: ["デザート", "冷たい"],
    price: 300,
    stock: 20,
  },
]

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(
    undefined,
  )
  const [viewMode, setViewMode] = useState<"table" | "card">("table")

  const handleSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      // 更新
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...data, id: editingProduct.id } : p,
        ),
      )
    } else {
      // 新規追加
      const newId = Math.max(...products.map((p) => p.id), 0) + 1
      setProducts((prev) => [...prev, { ...data, id: newId }])
    }
    setShowForm(false)
    setEditingProduct(undefined)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("この商品を削除しますか？")) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(undefined)
  }

  // 統計情報
  const totalProducts = products.length
  const lowStockCount = products.filter(
    (p) => p.stock <= 5 && p.stock > 0,
  ).length
  const outOfStockCount = products.filter((p) => p.stock === 0).length
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)

  const columns = createProductColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
              <p className="text-gray-600 mt-1">厨房管理システム - 店員用</p>
            </div>
            <Button onClick={() => setShowForm(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              商品を追加
            </Button>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総商品数</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">登録済み商品</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">在庫切れ</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {outOfStockCount}
              </div>
              <p className="text-xs text-muted-foreground">要補充商品</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">残りわずか</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground">在庫5個以下</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">在庫総額</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("ja-JP", {
                  style: "currency",
                  currency: "JPY",
                }).format(totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">現在の在庫価値</p>
            </CardContent>
          </Card>
        </div>

        {showForm ? (
          <div className="flex justify-center">
            <ProductForm
              product={editingProduct}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>商品一覧</CardTitle>
                <ViewModeToggle
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onAddProduct={() => setShowForm(true)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "table" ? (
                <ProductTableView
                  columns={columns}
                  data={products}
                  searchKey="name"
                  searchPlaceholder="商品名で検索..."
                />
              ) : (
                <ProductCardView
                  products={products}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
