import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDown,
  Edit,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/shadcn-ui/components/button"
import { Badge } from "@/shadcn-ui/components/badge"
import { Checkbox } from "@/shadcn-ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn-ui/components/dropdown-menu"
import type { Product } from "../-lib/product"

type ProductColumnsProps = {
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
}

export const createProductColumns = ({
  onEdit,
  onDelete,
}: ProductColumnsProps): ColumnDef<Product>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="全て選択"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="行を選択"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "image",
    header: "画像",
    cell: ({ row }) => {
      const product = row.original
      return (
        <img
          src={product.image || "/placeholder.svg?height=60&width=60"}
          alt={product.name}
          className="w-15 h-15 object-cover rounded-md border"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=60&width=60"
          }}
        />
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          商品名
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "tags",
    header: "タグ",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[]
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const tags = row.getValue(id) as string[]
      return tags.some((tag) => tag.toLowerCase().includes(value.toLowerCase()))
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold justify-end"
        >
          価格
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = Number.parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
      }).format(price)
      return <div className="text-right font-mono">{formatted}</div>
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold justify-center"
        >
          在庫数
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      return <div className="text-center font-mono">{stock}</div>
    },
  },
  {
    id: "status",
    header: "ステータス",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      let variant: "default" | "secondary" | "destructive" = "default"
      let text = "在庫あり"
      let showIcon = false

      if (stock === 0) {
        variant = "destructive"
        text = "在庫切れ"
        showIcon = true
      } else if (stock <= 5) {
        variant = "secondary"
        text = "残りわずか"
      }

      return (
        <div className="flex justify-center">
          <Badge variant={variant} className="flex items-center gap-1">
            {showIcon && <AlertTriangle className="h-3 w-3" />}
            {text}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const stock = row.getValue("stock") as number
      if (value === "在庫切れ") return stock === 0
      if (value === "残りわずか") return stock > 0 && stock <= 5
      if (value === "在庫あり") return stock > 5
      return true
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const product = row.original

      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">メニューを開く</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(product.id.toString())
                }
              >
                IDをコピー
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(product.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]
