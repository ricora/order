import ChevronDownIcon from "../../../../components/icons/lucide/chevronDownIcon"
import TagInput from "./$tagInput"

type ProductRegisterProps = {
  tags: string[]
}

const ProductRegister = ({ tags }: ProductRegisterProps) => (
  <div className="bg-white rounded-lg border max-w-7xl mx-auto mt-6 mb-6 p-4">
    <details className="group">
      <summary
        className="flex items-center justify-between cursor-pointer select-none outline-none focus:ring-2 focus:ring-blue-500"
        aria-controls="product-register-form"
        aria-expanded="false"
        tabIndex={0}
      >
        <span className="flex items-baseline gap-2">
          <span className="text-lg font-bold">商品登録</span>
          <span className="text-xs text-gray-400 ml-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品名
              <input
                type="text"
                name="name"
                className="w-full border rounded px-3 py-2 placeholder:text-gray-400 mt-1"
                placeholder="商品名を入力してください"
                required
                minLength={1}
                maxLength={100}
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              画像URL
              <input
                type="url"
                name="image"
                className="w-full border rounded px-3 py-2 placeholder:text-gray-400 mt-1"
                placeholder="https://example.com/image.jpg"
              />
            </label>
          </div>
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                価格（円）
                <input
                  type="number"
                  name="price"
                  className="w-full border rounded px-3 py-2 placeholder:text-gray-400 mt-1"
                  min={0}
                  step={1}
                  required
                  placeholder="0"
                />
              </label>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                在庫数
                <input
                  type="number"
                  name="stock"
                  className="w-full border rounded px-3 py-2 placeholder:text-gray-400 mt-1"
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
            <div className="text-xs text-gray-400 mt-1">
              既存タグは一覧からクリックで追加できます。新しいタグも入力して追加できます。
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-3 py-2 rounded border bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition w-full"
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
