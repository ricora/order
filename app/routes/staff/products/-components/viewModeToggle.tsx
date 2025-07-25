import type { FC } from "hono/jsx"
import Grid3X3Icon from "../../../../components/icons/lucide/grid3X3Icon"
import TableIcon from "../../../../components/icons/lucide/tableIcon"
import { setQueryParam } from "../../../../utils/url"

type ViewModeToggleProps = {
  viewMode: "table" | "card"
  search: string
}

const ViewModeToggle: FC<ViewModeToggleProps> = ({ viewMode, search }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">表示モード:</span>
        <div className="flex border rounded-lg p-1 bg-gray-50">
          <a
            href={setQueryParam(search, "view", "table")}
            className={`h-8 px-3 flex items-center rounded-md text-sm font-medium transition ${
              viewMode === "table"
                ? "bg-blue-600 text-white pointer-events-none"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            aria-current={viewMode === "table" ? "page" : undefined}
          >
            <div className="h-4 w-4 mr-2">
              <TableIcon />
            </div>
            テーブル
          </a>
          <a
            href={setQueryParam(search, "view", "card")}
            className={`h-8 px-3 flex items-center rounded-md text-sm font-medium transition ${
              viewMode === "card"
                ? "bg-blue-600 text-white pointer-events-none"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            aria-current={viewMode === "card" ? "page" : undefined}
          >
            <div className="h-4 w-4 mr-2">
              <Grid3X3Icon />
            </div>
            カード
          </a>
        </div>
      </div>
    </div>
  )
}

export default ViewModeToggle
