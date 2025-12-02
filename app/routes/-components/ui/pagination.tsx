import type { JSX } from "hono/jsx/jsx-runtime"
import { tv } from "tailwind-variants"
import { setQueryParam } from "../../../utils/url"
import ChevronLeftIcon from "../icons/lucide/chevronLeftIcon"
import ChevronRightIcon from "../icons/lucide/chevronRightIcon"
import LinkButton from "./linkButton"

const paginationTv = tv({
  slots: {
    button:
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 font-medium text-sm transition",
    container: "flex items-center justify-center gap-8 pt-6",
    info: "min-w-24 text-center text-muted-fg text-sm",
  },
  variants: {
    disabled: {
      false: {
        button: "border-border bg-bg text-fg hover:bg-muted",
      },
      true: {
        button:
          "pointer-events-none cursor-not-allowed border-border/50 bg-muted/50 text-muted-fg",
      },
    },
  },
})

type PaginationProps = {
  currentPage: number
  hasNextPage: boolean
  urlSearch: string
}

const Pagination = ({
  currentPage,
  hasNextPage,
  urlSearch,
}: PaginationProps): JSX.Element => {
  const styles = paginationTv()
  const hasPreviousPage = currentPage > 1

  return (
    <div className={styles.container()}>
      <LinkButton
        href={setQueryParam(urlSearch, "page", String(currentPage - 1))}
        leftIcon={ChevronLeftIcon}
        ariaLabel="前へ"
        disabled={!hasPreviousPage}
        kind="default"
      >
        前へ
      </LinkButton>
      <div className={styles.info()}>ページ {currentPage}</div>
      <LinkButton
        href={setQueryParam(urlSearch, "page", String(currentPage + 1))}
        rightIcon={ChevronRightIcon}
        ariaLabel="次へ"
        disabled={!hasNextPage}
        kind="default"
      >
        次へ
      </LinkButton>
    </div>
  )
}

export default Pagination
