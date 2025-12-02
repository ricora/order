import type { Child, FC, PropsWithChildren } from "hono/jsx"
import { createRoute } from "honox/factory"
import { ORDER_HISTORY_COLUMNS } from "../../../../usecases/queries/exportOrderHistoryCsv"
import { PRODUCT_CATALOG_COLUMNS } from "../../../../usecases/queries/exportProductCatalogCsv"
import ChevronLeftIcon from "../../../-components/icons/lucide/chevronLeftIcon"
import Callout from "../../../-components/ui/callout"
import LinkButton from "../../../-components/ui/linkButton"
import Layout from "../../-components/layout"

type ColumnDescriptionProps = {
  name: string
  description: Child
}

type CsvFormatSectionProps = PropsWithChildren<{
  title: string
  columns: ReadonlyArray<ColumnDescriptionProps>
}>

const CsvFormatSection: FC<CsvFormatSectionProps> = ({
  title,
  children,
  columns,
}) => (
  <div class="rounded-lg border bg-bg p-6">
    <div class="mb-6">
      <h2 class="font-semibold text-fg text-lg">{title}</h2>
      <div class="mt-2 text-fg text-sm">{children}</div>
    </div>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
      {columns.map((column) => (
        <div
          key={column.name}
          class="grid grid-cols-subgrid gap-3 rounded border border-border bg-muted p-3 sm:col-span-2"
        >
          <code class="font-mono text-primary text-sm">{column.name}</code>
          <span class="text-fg text-sm">{column.description}</span>
        </div>
      ))}
    </div>
  </div>
)

export default createRoute(async (c) => {
  return c.render(
    <Layout
      title="CSVフォーマット仕様"
      description="エクスポートされるCSVファイルの各カラムの説明です。"
    >
      <div class="space-y-6">
        <div class="rounded-lg border bg-bg p-6">
          <h2 class="font-semibold text-fg text-lg">共通仕様</h2>
          <ul class="my-4 list-disc space-y-2 pl-5 text-fg text-sm">
            <li>文字エンコーディング： UTF-8</li>
            <li>ヘッダー行： 1行目に各カラム名が含まれる</li>
            <li>
              日付形式： ISO 8601形式（例: <code>2025-01-15T12:34:56.789Z</code>
              ）
            </li>
            <li>
              複数値の区切り： パイプ（<code>|</code>）で区切られる
            </li>
          </ul>
          <div class="mt-4">
            <Callout variant="info" title="注意事項">
              <p>
                CSVファイルをExcelで開く場合、日付や数値の表示形式が自動変換される場合があります。データの正確性を保つため、テキストエディタやデータ分析ツールでの利用を推奨します。
              </p>
            </Callout>
          </div>
        </div>

        <CsvFormatSection title="注文履歴CSV" columns={ORDER_HISTORY_COLUMNS}>
          <p>
            注文とその注文明細のネスト構造をフラット化した形式で出力されます。
          </p>
          <p class="mt-2">1つの注文に複数の注文明細がある場合：</p>
          <ul class="mt-1 list-disc space-y-1 pl-5">
            <li>
              注文レベルのフィールド（<code>order_id</code>、
              <code>order_created_at</code>
              など）は各明細行に繰り返し記録される
            </li>
            <li>
              注文明細レベルのフィールド（<code>product_id</code>、
              <code>quantity</code>など）は各明細行ごとに異なる値が記録される
            </li>
          </ul>
        </CsvFormatSection>

        <CsvFormatSection
          title="商品カタログCSV"
          columns={PRODUCT_CATALOG_COLUMNS}
        >
          <p>すべての商品情報が1商品につき1行で出力されます。</p>
        </CsvFormatSection>

        <div class="rounded-lg border bg-bg p-6">
          <div class="flex justify-center">
            <LinkButton href="/staff/analytics" leftIcon={ChevronLeftIcon}>
              売上分析ページに戻る
            </LinkButton>
          </div>
        </div>
      </div>
    </Layout>,
  )
})
