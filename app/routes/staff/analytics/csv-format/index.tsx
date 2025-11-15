import { createRoute } from "honox/factory"
import Layout from "../../-components/layout"

type ColumnDescriptionProps = {
  name: string
  description: string
}

type CsvFormatSectionProps = {
  title: string
  description: string
  columns: ColumnDescriptionProps[]
}

const CsvFormatSection = ({
  title,
  description,
  columns,
}: CsvFormatSectionProps) => (
  <div className="rounded-lg border bg-bg p-6">
    <div className="mb-6">
      <h2 className="font-semibold text-fg text-lg">{title}</h2>
      <p className="mt-1 text-muted-fg text-sm">{description}</p>
    </div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
      {columns.map((column) => (
        <div
          key={column.name}
          className="grid grid-cols-subgrid gap-3 rounded border border-border bg-muted p-3 sm:col-span-2"
        >
          <code className="font-mono text-primary text-sm">{column.name}</code>
          <span className="text-muted-fg text-sm">{column.description}</span>
        </div>
      ))}
    </div>
  </div>
)

export default createRoute(async (c) => {
  const orderHistoryColumns: ColumnDescriptionProps[] = [
    {
      name: "order_id",
      description: "注文ID（一意の識別子）",
    },
    {
      name: "order_created_at",
      description: "注文作成日時（ISO 8601形式）",
    },
    {
      name: "order_updated_at",
      description: "注文更新日時（ISO 8601形式）",
    },
    {
      name: "order_status",
      description: "注文ステータス（pending/confirmed/completed）",
    },
    {
      name: "customer_name",
      description: "顧客名",
    },
    {
      name: "order_total_amount",
      description: "注文合計金額（円）",
    },
    {
      name: "order_item_count",
      description: "注文明細行数",
    },
    {
      name: "line_index",
      description: "明細行番号（1から始まる連番）",
    },
    {
      name: "product_id",
      description: "商品ID",
    },
    {
      name: "product_name",
      description: "商品名",
    },
    {
      name: "unit_amount",
      description: "単価（円）",
    },
    {
      name: "quantity",
      description: "数量",
    },
    {
      name: "line_total_amount",
      description: "明細行合計金額（単価×数量、円）",
    },
  ]

  const productCatalogColumns: ColumnDescriptionProps[] = [
    {
      name: "product_id",
      description: "商品ID（一意の識別子）",
    },
    {
      name: "product_name",
      description: "商品名",
    },
    {
      name: "price",
      description: "価格（円）",
    },
    {
      name: "stock",
      description: "在庫数",
    },
    {
      name: "image_url",
      description: "商品画像URL（絶対URL）",
    },
    {
      name: "tag_ids",
      description: "タグID（パイプ区切り、例: 1|3|5）",
    },
    {
      name: "tag_names",
      description: "タグ名（パイプ区切り、例: 飲料|冷凍）",
    },
    {
      name: "tag_count",
      description: "タグ数",
    },
  ]

  return c.render(
    <Layout
      title="CSVフォーマット仕様"
      description="エクスポートされるCSVファイルの各カラムの説明です。"
    >
      <div className="space-y-6">
        <div className="rounded-lg border bg-bg p-6">
          <h2 className="font-semibold text-fg text-lg">共通仕様</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-fg text-sm">
            <li>文字エンコーディング: UTF-8</li>
            <li>ヘッダー行: 1行目に各カラム名が含まれます</li>
            <li>日付形式: ISO 8601形式（例: 2025-01-15T12:34:56.789Z）</li>
            <li>複数値の区切り: パイプ（|）で区切られます</li>
          </ul>
        </div>

        <CsvFormatSection
          title="注文履歴CSV"
          description="注文とその明細行がすべて含まれます。1つの注文に複数の明細行がある場合、注文情報は各行に繰り返されます。"
          columns={orderHistoryColumns}
        />

        <CsvFormatSection
          title="商品カタログCSV"
          description="すべての商品情報が1商品につき1行で出力されます。"
          columns={productCatalogColumns}
        />

        <div className="rounded-lg border bg-bg p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-info-subtle bg-info-subtle p-2">
              <div className="h-5 w-5 text-info-subtle-fg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  role="graphics-symbol"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-fg">注意事項</h3>
              <p className="mt-2 text-muted-fg text-sm">
                CSVファイルをExcelで開く場合、日付や数値の表示形式が自動変換される場合があります。データの正確性を保つため、テキストエディタやデータ分析ツールでの利用を推奨します。
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <a
            href="/staff/analytics"
            className="inline-flex items-center gap-2 rounded border border-border bg-muted px-4 py-2 text-fg text-sm transition hover:border-primary hover:bg-primary-subtle hover:text-primary-subtle-fg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4"
              role="graphics-symbol"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            売上分析ページに戻る
          </a>
        </div>
      </div>
    </Layout>,
  )
})
