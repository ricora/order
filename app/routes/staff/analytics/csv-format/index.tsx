import type { Child, FC, PropsWithChildren } from "hono/jsx"
import { createRoute } from "honox/factory"
import { ORDER_HISTORY_COLUMNS } from "../../../../usecases/queries/exportOrderHistoryCsv"
import { PRODUCT_CATALOG_COLUMNS } from "../../../../usecases/queries/exportProductCatalogCsv"
import ChevronLeftIcon from "../../../-components/icons/lucide/chevronLeftIcon"
import Callout from "../../../-components/ui/callout"
import LinkButton from "../../../-components/ui/linkButton"
import Layout from "../../-components/layout"

type ColumnName = string

type ColumnDescriptionMap = Record<string, Child>

const ORDER_HISTORY_COLUMN_DESCRIPTIONS: ColumnDescriptionMap = {
  order_id: <>注文ID（一意の識別子）</>,
  order_created_at: <>注文の作成日時（JST, ISO 8601形式）</>,
  order_updated_at: <>注文の更新日時（JST, ISO 8601形式）</>,
  order_status: (
    <>
      注文のステータス（<code>pending</code> / <code>confirmed</code> /{" "}
      <code>completed</code>）
    </>
  ),
  customer_name: <>注文の顧客名</>,
  order_total_amount: <>注文全体の合計金額（円）</>,
  order_item_count: <>注文に含まれる注文明細の総数</>,
  line_index: <>注文明細の行番号（1から始まる連番）</>,
  product_id: <>注文明細の商品ID</>,
  product_name: <>注文明細の商品名</>,
  unit_amount: <>注文明細の単価（円）</>,
  quantity: <>注文明細の数量</>,
  line_total_amount: <>注文明細の合計金額（単価×数量、円）</>,
}

const PRODUCT_CATALOG_COLUMN_DESCRIPTIONS: ColumnDescriptionMap = {
  product_id: <>商品ID（一意の識別子）</>,
  product_name: <>商品名</>,
  price: <>価格（円）</>,
  stock: <>在庫数</>,
  image_url: <>商品画像URL（絶対URL）</>,
  tag_ids: (
    <>
      タグID（パイプ区切り、例: <code>1|3|5</code>）
    </>
  ),
  tag_names: (
    <>
      タグ名（パイプ区切り、例: <code>飲料|冷凍</code>）
    </>
  ),
  tag_count: <>タグ数</>,
}

type CsvFormatSectionProps = PropsWithChildren<{
  title: string
  columns: ReadonlyArray<ColumnName>
  descriptionMap?: ColumnDescriptionMap
}>

const CsvFormatSection: FC<CsvFormatSectionProps> = ({
  title,
  children,
  columns,
  descriptionMap,
}) => (
  <div class="rounded-lg border bg-bg p-6">
    <div class="mb-6">
      <h2 class="font-semibold text-fg text-lg">{title}</h2>
      <div class="mt-2 text-fg text-sm">{children}</div>
    </div>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
      {columns.map((column) => (
        <div
          key={column}
          class="grid grid-cols-subgrid gap-3 rounded border border-border bg-muted p-3 sm:col-span-2"
        >
          <code class="font-mono text-primary text-sm">{column}</code>
          <span class="text-fg text-sm">
            {(() => descriptionMap?.[column])()}
          </span>
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

        <CsvFormatSection
          title="注文履歴CSV"
          columns={ORDER_HISTORY_COLUMNS}
          descriptionMap={ORDER_HISTORY_COLUMN_DESCRIPTIONS}
        >
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
          descriptionMap={PRODUCT_CATALOG_COLUMN_DESCRIPTIONS}
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
