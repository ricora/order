"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/shadcn-ui/components/button"
import { Input } from "@/shadcn-ui/components/input"
import { Label } from "@/shadcn-ui/components/label"
import { Badge } from "@/shadcn-ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shadcn-ui/components/card"
import { X, Plus } from "lucide-react"
import type { Product, ProductFormData } from "../-lib/product"

type ProductFormProps = {
  product?: Product
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
}

export const ProductForm = ({
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || "",
    image: product?.image || "",
    tags: product?.tags || [],
    price: product?.price || 0,
    stock: product?.stock || 0,
  })
  const [newTag, setNewTag] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{product ? "商品情報を編集" : "新しい商品を登録"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">商品名</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="商品名を入力してください"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">画像URL</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, image: e.target.value }))
              }
              placeholder="https://example.com/image.jpg"
              type="url"
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image || "/placeholder.svg"}
                  alt="商品プレビュー"
                  className="w-48 h-48 object-cover rounded-md border"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/placeholder.svg?height=192&width=192"
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">価格（円）</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">在庫数</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stock: Number(e.target.value),
                  }))
                }
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>タグ</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="タグを入力"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {product ? "更新" : "登録"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent"
            >
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
