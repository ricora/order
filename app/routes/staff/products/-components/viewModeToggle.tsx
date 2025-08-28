import type { FC } from "hono/jsx"
import { tv } from "tailwind-variants"
import Grid3X3Icon from "../../../../components/icons/lucide/grid3X3Icon"
import TableIcon from "../../../../components/icons/lucide/tableIcon"
import { setQueryParam } from "../../../../utils/url"

const viewModeToggle = tv({
  slots: {
    container: "flex items-center justify-between",
    label: "text-sm font-medium text-gray-500",
    toggleGroup: "flex border rounded-lg p-1 bg-gray-50",
    button:
      "h-8 px-3 flex items-center rounded-md text-sm font-medium transition",
    icon: "h-4 w-4 mr-2",
  },
  variants: {
    isActive: {
      true: {
        button: "bg-blue-600 text-white pointer-events-none",
      },
      false: {
        button: "bg-white text-gray-700 hover:bg-gray-100",
      },
    },
  },
})

type ViewModeToggleProps = {
  viewMode: "table" | "card"
  search: string
}

const ViewModeToggle: FC<ViewModeToggleProps> = ({ viewMode, search }) => {
  const { container, label, toggleGroup, button, icon } = viewModeToggle()

  return (
    <div className={container()}>
      <div className="flex items-center gap-2">
        <span className={label()}>表示モード:</span>
        <div className={toggleGroup()}>
          <a
            href={setQueryParam(search, "view", "table")}
            className={button({ isActive: viewMode === "table" })}
            aria-current={viewMode === "table" ? "page" : undefined}
          >
            <div className={icon()}>
              <TableIcon />
            </div>
            テーブル
          </a>
          <a
            href={setQueryParam(search, "view", "card")}
            className={button({ isActive: viewMode === "card" })}
            aria-current={viewMode === "card" ? "page" : undefined}
          >
            <div className={icon()}>
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
