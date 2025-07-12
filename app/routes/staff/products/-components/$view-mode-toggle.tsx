import { Button } from "@/shadcn-ui/components/button"
import { Table, Grid3X3, Plus } from "lucide-react"

type ViewModeToggleProps = {
  viewMode: "table" | "card"
  onViewModeChange: (mode: "table" | "card") => void
  onAddProduct: () => void
}

export const ViewModeToggle = ({
  viewMode,
  onViewModeChange,
  onAddProduct,
}: ViewModeToggleProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          表示モード:
        </span>
        <div className="flex border rounded-lg p-1">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("table")}
            className="h-8"
          >
            <Table className="h-4 w-4 mr-2" />
            テーブル
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("card")}
            className="h-8"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            カード
          </Button>
        </div>
      </div>
      <Button onClick={onAddProduct}>
        <Plus className="h-4 w-4 mr-2" />
        商品を追加
      </Button>
    </div>
  )
}
