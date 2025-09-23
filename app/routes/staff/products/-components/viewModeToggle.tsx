import type { FC } from "hono/jsx"
import { tv } from "tailwind-variants"
import Grid3X3Icon from "../../../../components/icons/lucide/grid3X3Icon"
import TableIcon from "../../../../components/icons/lucide/tableIcon"
import { setQueryParam } from "../../../../utils/url"

const viewModeToggle = tv({
  slots: {
    container: "flex items-center justify-between",
    label: "font-medium text-muted-fg text-sm",
    toggleGroup: "flex rounded-lg border border-border bg-muted p-1",
    button:
      "flex h-8 items-center rounded-md px-3 font-medium text-sm transition",
    icon: "mr-2 h-4 w-4",
  },
  variants: {
    isActive: {
      true: {
        button: "pointer-events-none bg-primary text-primary-fg",
      },
      false: {
        button: "bg-bg text-muted-fg hover:bg-muted",
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
