import type { JSX } from "hono/jsx/jsx-runtime"
import { tv } from "tailwind-variants"
import { setQueryParam } from "../../utils/url"
import Grid3X3Icon from "../icons/lucide/grid3X3Icon"
import SquarePenIcon from "../icons/lucide/squarePenIcon"
import TableIcon from "../icons/lucide/tableIcon"
import Trash2Icon from "../icons/lucide/trash2Icon"

const itemCollectionTv = tv({
  slots: {
    container: "rounded-lg border bg-bg p-6",
    header: "mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row",
    title: "font-bold text-lg",
    toggleContainer: "flex items-center gap-2",
    toggleLabel: "font-medium text-muted-fg text-sm",
    toggleGroup: "flex gap-x-1 rounded-lg bg-muted p-1",
    toggleButton:
      "flex h-8 items-center rounded-md px-3 font-medium text-sm transition",
    toggleIcon: "mr-2 h-4 w-4",
    emptyState: "py-12 text-center text-lg text-muted-fg",
    cardGrid:
      "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    tableWrapper: "w-full overflow-x-auto",
    tableContainer: "min-w-3xl rounded-md border bg-bg",
    table: "min-w-full divide-y divide-border",
    thead: "bg-muted",
    tbody: "divide-y divide-border/60 bg-bg",
    card: "flex flex-col overflow-hidden rounded-lg border bg-bg",
    cardImageWrapper:
      "relative aspect-square overflow-hidden rounded-md border bg-muted",
    cardImage: "h-full w-full rounded-md object-cover",
    cardBadge: "absolute top-2 right-2",
    cardBody: "flex flex-1 flex-col justify-between p-4",
    cardContent: "space-y-3",
    cardField: "space-y-1",
    cardFieldLabel:
      "font-medium text-muted-fg text-xs uppercase tracking-wider",
    cardFieldValue: "",
    cardTitle: "line-clamp-2 font-semibold text-lg",
    cardTags: "mt-2 flex flex-wrap gap-1",
    cardTag: "rounded border bg-muted px-2 py-0.5 text-muted-fg text-xs",
    cardFooter: "flex gap-2 pt-4",
    editButton:
      "flex flex-1 items-center justify-center gap-2 rounded-md border bg-bg px-3 py-2 font-medium text-fg text-sm transition hover:bg-muted",
    deleteButton:
      "flex flex-1 items-center justify-center gap-2 rounded-md border bg-bg px-3 py-2 font-medium text-danger-subtle-fg text-sm transition hover:border-danger-subtle hover:bg-danger-subtle",
    buttonIcon: "h-4 w-4",
    tableCell: "px-4 py-2 align-middle",
    tableCellRight: "px-4 py-2 text-right align-middle",
    tableCellCenter: "px-4 py-2 text-center align-middle",
    tableHeader:
      "px-4 py-2 text-left font-medium text-muted-fg text-xs uppercase tracking-wider",
    tableHeaderRight:
      "px-4 py-2 text-right font-medium text-muted-fg text-xs uppercase tracking-wider",
    tableHeaderCenter:
      "px-4 py-2 text-center font-medium text-muted-fg text-xs uppercase tracking-wider",
    tableImage: "h-12 min-h-12 w-12 min-w-12 rounded-md border object-cover",
    tableImageCell: "w-16 min-w-16 px-2 py-2 align-middle",
    tableActions: "flex flex-col items-center gap-2",
  },
  variants: {
    isActive: {
      true: {
        toggleButton:
          "pointer-events-none bg-primary-subtle text-primary-subtle-fg",
      },
      false: {
        toggleButton: "hover:bg-secondary",
      },
    },
  },
})

type ViewMode = "table" | "card"

type FieldValue =
  | { type: "text"; value: string }
  | { type: "number"; value: number }
  | { type: "image"; src: string; alt: string }
  | { type: "custom"; content: JSX.Element }

type Column = {
  header: string
  align?: "left" | "center" | "right"
}

type Item = {
  id: number | string
  fields: FieldValue[]
  editUrl: string
  deleteUrl: string
}

const FieldValueCell = ({
  field,
  isCard = false,
}: {
  field: FieldValue
  isCard?: boolean
}) => {
  const styles = itemCollectionTv()

  switch (field.type) {
    case "text":
      return <span>{field.value}</span>
    case "number":
      return <span className="font-mono">{field.value}</span>
    case "image":
      if (isCard) {
        return (
          <div className={styles.cardImageWrapper()}>
            <img
              src={field.src || "/placeholder.svg?height=300&width=300"}
              alt={field.alt}
              className={styles.cardImage()}
              loading="lazy"
            />
          </div>
        )
      }
      return (
        <img
          src={field.src || "/placeholder.svg?height=60&width=60"}
          alt={field.alt}
          className={styles.tableImage()}
          loading="lazy"
        />
      )
    case "custom":
      return field.content
  }
}

const ItemCard = ({ item, columns }: { item: Item; columns: Column[] }) => {
  const styles = itemCollectionTv()

  return (
    <div className={styles.card()}>
      <div className={styles.cardBody()}>
        <div className={styles.cardContent()}>
          {item.fields.map((field, index) => {
            const column = columns[index]
            const isImage = field.type === "image"

            if (isImage) {
              return (
                <div>
                  <FieldValueCell field={field} isCard={true} />
                </div>
              )
            }

            return (
              <div className={styles.cardField()}>
                {column && (
                  <div className={styles.cardFieldLabel()}>{column.header}</div>
                )}
                <div className={styles.cardFieldValue()}>
                  <FieldValueCell field={field} isCard={true} />
                </div>
              </div>
            )
          })}
        </div>
        <div className={styles.cardFooter()}>
          <a href={item.editUrl} className={styles.editButton()}>
            <div className={styles.buttonIcon()}>
              <SquarePenIcon />
            </div>
            編集
          </a>
          <a href={item.deleteUrl} className={styles.deleteButton()}>
            <div className={styles.buttonIcon()}>
              <Trash2Icon />
            </div>
            削除
          </a>
        </div>
      </div>
    </div>
  )
}

type ItemCollectionViewerProps = {
  title: string
  columns: Column[]
  items: Item[]
  viewMode: ViewMode
  urlSearch: string
  emptyMessage?: string
}

const ItemCollectionViewer = ({
  title,
  columns,
  items,
  viewMode,
  urlSearch,
  emptyMessage = "データがありません",
}: ItemCollectionViewerProps) => {
  const styles = itemCollectionTv()

  return (
    <div className={styles.container()}>
      <div className={styles.header()}>
        <h2 className={styles.title()}>{title}</h2>
        <div className={styles.toggleContainer()}>
          <span className={styles.toggleLabel()}>表示モード:</span>
          <div className={styles.toggleGroup()}>
            <a
              href={setQueryParam(urlSearch, "view", "table")}
              className={styles.toggleButton({
                isActive: viewMode === "table",
              })}
              aria-current={viewMode === "table" ? "page" : undefined}
            >
              <div className={styles.toggleIcon()}>
                <TableIcon />
              </div>
              テーブル
            </a>
            <a
              href={setQueryParam(urlSearch, "view", "card")}
              className={styles.toggleButton({ isActive: viewMode === "card" })}
              aria-current={viewMode === "card" ? "page" : undefined}
            >
              <div className={styles.toggleIcon()}>
                <Grid3X3Icon />
              </div>
              カード
            </a>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState()}>{emptyMessage}</div>
      ) : viewMode === "card" ? (
        <div className={styles.cardGrid()}>
          {items.map((item) => (
            <div>
              <ItemCard item={item} columns={columns} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.tableWrapper()}>
          <div className={styles.tableContainer()}>
            <table className={styles.table()}>
              <thead className={styles.thead()}>
                <tr>
                  {columns.map((col) => {
                    const className =
                      col.align === "right"
                        ? styles.tableHeaderRight()
                        : col.align === "center"
                          ? styles.tableHeaderCenter()
                          : styles.tableHeader()
                    return <th className={className}>{col.header}</th>
                  })}
                  <th className={styles.tableHeaderCenter()}>編集</th>
                </tr>
              </thead>
              <tbody className={styles.tbody()}>
                {items.map((item) => (
                  <tr>
                    {item.fields.map((field, fieldIndex) => {
                      const col = columns[fieldIndex]
                      const isImage = field.type === "image"
                      const className = isImage
                        ? styles.tableImageCell()
                        : col?.align === "right"
                          ? styles.tableCellRight()
                          : col?.align === "center"
                            ? styles.tableCellCenter()
                            : styles.tableCell()

                      return (
                        <td className={className}>
                          <FieldValueCell field={field} isCard={false} />
                        </td>
                      )
                    })}
                    <td className={styles.tableCell()}>
                      <div className={styles.tableActions()}>
                        <a href={item.editUrl} className={styles.editButton()}>
                          <div className={styles.buttonIcon()}>
                            <SquarePenIcon />
                          </div>
                          編集
                        </a>
                        <a
                          href={item.deleteUrl}
                          className={styles.deleteButton()}
                        >
                          <div className={styles.buttonIcon()}>
                            <Trash2Icon />
                          </div>
                          削除
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemCollectionViewer
