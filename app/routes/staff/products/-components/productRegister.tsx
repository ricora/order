import ChevronDownIcon from "../../../../components/icons/lucide/chevronDownIcon"
import type ProductTag from "../../../../domain/product/entities/productTag"
import TagInput from "./$tagInput"

type ProductRegisterProps = {
  tags: ProductTag[]
}

const ProductRegister = ({ tags }: ProductRegisterProps) => (
  <div className="mx-auto mt-6 mb-6 max-w-7xl rounded-lg border bg-white p-4">
    <details className="group">
      <summary
        className="flex cursor-pointer select-none items-center justify-between outline-none focus:ring-2 focus:ring-blue-500"
        aria-controls="product-register-form"
        tabIndex={0}
      >
        <span className="flex items-baseline gap-2">
          <span className="font-bold text-lg">商品登録</span>
          <span className="ml-2 text-gray-400 text-xs">
            クリックで開閉します。
          </span>
        </span>
        <span className="ml-2 transition-transform group-open:rotate-180">
          <div className="h-4 w-4 text-gray-500">
            <ChevronDownIcon />
          </div>
        </span>
      </summary>
      <div id="product-register-form" className="p-4">
        <form method="post">
          <div className="mb-4">
            <label className="mb-1 block font-medium text-gray-700 text-sm">
              商品名
              {/* TODO: サロゲートペアを考慮したクライアントバリデーションを実装する */}
              <input
                type="text"
                name="name"
                className="mt-1 w-full rounded border px-3 py-2 placeholder:text-gray-400"
                placeholder="商品名を入力してください"
                required
                minLength={1}
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="mb-1 block font-medium text-gray-700 text-sm">
              画像URL
              <input
                type="url"
                name="image"
                className="mt-1 w-full rounded border px-3 py-2 placeholder:text-gray-400"
                placeholder="https://example.com/image.jpg"
              />
            </label>
          </div>
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                価格（円）
                <input
                  type="number"
                  name="price"
                  className="mt-1 w-full rounded border px-3 py-2 placeholder:text-gray-400"
                  min={0}
                  step={1}
                  required
                  placeholder="0"
                />
              </label>
            </div>
            <div className="flex-1">
              <label className="mb-1 block font-medium text-gray-700 text-sm">
                在庫数
                <input
                  type="number"
                  name="stock"
                  className="mt-1 w-full rounded border px-3 py-2 placeholder:text-gray-400"
                  min={0}
                  step={1}
                  required
                  placeholder="0"
                />
              </label>
            </div>
          </div>
          <div className="mb-4">
            <TagInput existingTags={tags} />
            <div className="mt-1 text-gray-400 text-xs">
              既存タグは一覧からクリックで追加できます。新しいタグも入力して追加できます。
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded border bg-blue-600 px-3 py-2 font-medium text-sm text-white transition hover:bg-blue-700"
            >
              登録
            </button>
          </div>
        </form>
      </div>
    </details>
  </div>
)

export default ProductRegister
