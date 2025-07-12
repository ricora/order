import { Badge } from "@/shadcn-ui/components/badge"
import { Button } from "@/shadcn-ui/components/button"
import { Card, CardContent } from "@/shadcn-ui/components/card"
import { AlertTriangle, Edit, Trash2 } from "lucide-react"
import type { Product } from "../-lib/product"

type ProductCardViewProps = {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
}

export const ProductCardView = ({
  products,
  onEdit,
  onDelete,
}: ProductCardViewProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price)
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return {
        variant: "destructive" as const,
        text: "在庫切れ",
        showIcon: true,
      }
    if (stock <= 5)
      return {
        variant: "secondary" as const,
        text: "残りわずか",
        showIcon: false,
      }
    return { variant: "default" as const, text: "在庫あり", showIcon: false }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">
          商品が登録されていません
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const stockStatus = getStockStatus(product.stock)
        return (
          <Card
            key={product.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              <img
                src={product.image || "/placeholder.svg?height=300&width=300"}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                }}
              />
              <div className="absolute top-2 right-2">
                <Badge
                  variant={stockStatus.variant}
                  className="flex items-center gap-1"
                >
                  {stockStatus.showIcon && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {stockStatus.text}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">在庫</div>
                    <div className="font-mono font-semibold">
                      {product.stock}個
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
