import type { FC } from "hono/jsx"
import { createRoute } from "honox/factory"
import { tv } from "tailwind-variants"
import ChevronRightIcon from "../../../components/icons/lucide/chevronRightIcon"
import ClipboardListIcon from "../../../components/icons/lucide/clipboardListIcon"
import DownloadIcon from "../../../components/icons/lucide/downloadIcon"
import InfoIcon from "../../../components/icons/lucide/infoIcon"
import PackageIcon from "../../../components/icons/lucide/packageIcon"
import LinkButton from "../../../components/ui/linkButton"
import Layout from "../-components/layout"

const csvExportItemVariants = tv({
  slots: {
    container:
      "flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between",
    content: "flex items-center gap-3",
    iconContainer: "rounded-lg bg-muted p-2.5",
    icon: "h-6 w-6 text-secondary-fg",
    textContent: "flex-1",
    title: "font-semibold text-secondary-fg",
    description: "mt-0.5 text-muted-fg text-sm",
    button:
      "inline-flex w-full items-center justify-center gap-2 rounded border border-primary bg-primary px-4 py-2 font-medium text-primary-fg text-sm transition hover:bg-primary/90 sm:w-auto",
    buttonIcon: "h-4 w-4",
  },
})

type CSVExportItemProps = {
  icon: FC
  title: string
  description: string
  exportUrl: string
  exportLabel: string
}

const CSVExportItem = ({
  icon,
  title,
  description,
  exportUrl,
  exportLabel,
}: CSVExportItemProps) => {
  const {
    container,
    content,
    iconContainer,
    icon: iconClass,
    textContent,
    title: titleClass,
    description: descriptionClass,
    button,
    buttonIcon,
  } = csvExportItemVariants()
  const Icon = icon

  return (
    <div class={container()}>
      <div class={content()}>
        <div class={iconContainer()}>
          <div class={iconClass()}>
            <Icon />
          </div>
        </div>
        <div class={textContent()}>
          <h3 class={titleClass()}>{title}</h3>
          <p class={descriptionClass()}>{description}</p>
        </div>
      </div>
      <a href={exportUrl} class={button()}>
        <div class={buttonIcon()}>
          <DownloadIcon />
        </div>
        {exportLabel}
      </a>
    </div>
  )
}

export default createRoute(async (c) => {
  return c.render(
    <Layout
      title="売上分析"
      description="売上データをCSV形式でエクスポートできます。"
    >
      <div class="rounded-lg border bg-bg p-6">
        <div class="mb-6">
          <h2 class="font-semibold text-fg text-lg">データエクスポート</h2>
          <p class="mt-1 text-muted-fg text-sm">
            売上データをCSV形式でダウンロードして分析できます。
          </p>
          <div class="mt-3">
            <LinkButton
              href="/staff/analytics/csv-format"
              leftIcon={InfoIcon}
              rightIcon={ChevronRightIcon}
              ariaLabel="CSVフォーマット仕様を確認する"
            >
              CSVフォーマット仕様を確認する
            </LinkButton>
          </div>
        </div>
        <div class="space-y-4">
          <CSVExportItem
            icon={ClipboardListIcon}
            title="注文履歴（CSV形式）"
            description="すべての注文データをCSV形式でエクスポートします。"
            exportUrl="/staff/analytics/orders/csv"
            exportLabel="CSVダウンロード"
          />
          <CSVExportItem
            icon={PackageIcon}
            title="商品カタログ（CSV形式）"
            description="すべての商品データをCSV形式でエクスポートします。"
            exportUrl="/staff/analytics/products/csv"
            exportLabel="CSVダウンロード"
          />
        </div>
      </div>
    </Layout>,
  )
})
