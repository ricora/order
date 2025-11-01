import { type FC, useState } from "hono/jsx"
import { tv } from "tailwind-variants"
import ChevronDownIcon from "../../../../components/icons/lucide/chevronDownIcon"
import XIcon from "../../../../components/icons/lucide/xIcon"
import type ProductTag from "../../../../domain/product/entities/productTag"
import { countStringLength, stripString } from "../../../../utils/text"

const counterTv = tv({
  base: "text-xs",
  variants: {
    state: {
      normal: "text-muted-fg",
      danger: "text-danger",
    },
  },
  defaultVariants: {
    state: "normal",
  },
})

const RemainingCounter: FC<{ valueLength: number; maxLength: number }> = ({
  valueLength,
  maxLength,
}) => {
  const remaining = Math.max(0, maxLength - valueLength)
  const state = remaining <= 0 ? "danger" : "normal"
  return (
    <div className="my-1 text-xs" aria-live="polite">
      <span className={counterTv({ state })}>残り{remaining}文字</span>
    </div>
  )
}

type TagInputProps = {
  existingTags: ProductTag[]
}

const TagInput: FC<TagInputProps> = ({ existingTags }) => {
  const [tags, setTags] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [isTagComposing, setIsTagComposing] = useState(false)
  const [suggestions, setSuggestions] = useState<ProductTag[]>([])
  const [inputLength, setInputLength] = useState(0)

  const maxTagLength = 50

  function updateSuggestions(value: string) {
    const v = value.trim().toLowerCase()
    setSuggestions(
      v
        ? existingTags.filter(
            (tag) =>
              tag.name.toLowerCase().includes(v) && !tags.includes(tag.name),
          )
        : [],
    )
  }

  function addTag(tagName?: string) {
    const raw = (tagName ?? input).trim()
    const value = stripString(raw, maxTagLength)
    if (!value) return
    if (tags.includes(value)) return
    setTags([...tags, value])
    setInput("")
    setInputLength(0)
    setSuggestions([])
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  const unselectedTags = existingTags.filter((tag) => !tags.includes(tag.name))

  return (
    <div>
      <label
        htmlFor="tag-input"
        className="mb-1 block font-medium text-fg text-sm"
      >
        タグ
      </label>
      <div className="mb-1 flex max-h-35 flex-wrap gap-2 overflow-auto rounded border border-border/50 bg-muted p-2">
        {unselectedTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className="cursor-pointer rounded border bg-white px-2 py-1 text-sm transition hover:border-primary-subtle hover:bg-primary-subtle"
            onClick={() => addTag(tag.name)}
            aria-label={`${tag.name}を追加`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          id="tag-input"
          type="text"
          className="mt-1 w-full rounded border border-border px-3 py-2 text-fg text-sm placeholder:text-muted-fg/80"
          placeholder="新しいタグを入力"
          value={input}
          autoComplete="off"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls="tag-suggestions"
          onCompositionStart={() => setIsTagComposing(true)}
          onCompositionEnd={() => setIsTagComposing(false)}
          onBeforeInput={(e: InputEvent) => {
            if (isTagComposing) return
            const data = e.data ?? ""
            if (countStringLength(input + String(data)) > maxTagLength) {
              e.preventDefault()
            }
          }}
          onInput={(e) => {
            const raw = (e.target as HTMLInputElement).value
            const value = stripString(raw, maxTagLength)
            setInput(value)
            setInputLength(countStringLength(value))
            updateSuggestions(value)
          }}
          onPaste={(e) => {
            e.preventDefault()
            const paste = e.clipboardData?.getData("text") ?? ""
            const newVal = stripString(input + paste, maxTagLength)
            setInput(newVal)
            setInputLength(countStringLength(newVal))
            updateSuggestions(newVal)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addTag()
            }
          }}
        />
        <button
          type="button"
          className="mt-1 whitespace-nowrap rounded border border-primary bg-primary px-3 py-2 font-medium text-primary-fg text-sm transition hover:bg-primary/90"
          onClick={() => addTag()}
        >
          追加
        </button>
      </div>

      <RemainingCounter valueLength={inputLength} maxLength={maxTagLength} />

      {suggestions.length > 0 && (
        <div
          id="tag-suggestions"
          tabIndex={-1}
          className="mb-2 max-h-40 overflow-auto rounded border bg-bg p-2 shadow"
          aria-live="polite"
        >
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="cursor-pointer rounded border bg-white px-2 py-1 text-sm transition hover:border-primary-subtle hover:bg-primary-subtle"
              onClick={() => addTag(tag.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") addTag(tag.name)
              }}
              aria-label={`${tag.name}を追加`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
      <div className="mb-2 flex flex-wrap gap-2" aria-live="polite">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center rounded border bg-muted px-2 py-1 text-muted-fg text-xs"
          >
            {tag}
            <button
              type="button"
              className="ml-1 text-muted-fg/80 transition hover:text-danger"
              onClick={() => removeTag(tag)}
              aria-label={`${tag}を削除`}
            >
              <div className="size-3">
                <XIcon />
              </div>
            </button>
            <input type="hidden" name="tags" value={tag} />
          </span>
        ))}
      </div>
    </div>
  )
}

type ProductRegisterProps = {
  tags: ProductTag[]
}

const ProductRegister = ({ tags }: ProductRegisterProps) => {
  const [productName, setProductName] = useState("")
  const [nameLength, setNameLength] = useState(0)
  const [isNameComposing, setIsNameComposing] = useState(false)
  const [imageValue, setImageValue] = useState("")
  const [imageLength, setImageLength] = useState(0)
  const [isImageComposing, setIsImageComposing] = useState(false)

  const maxNameLength = 50

  const handleNameChange = (value: string) => {
    const stripped = stripString(value, maxNameLength)
    setProductName(stripped)
    setNameLength(countStringLength(stripped))
  }

  const handleImageChange = (value: string) => {
    const maxImageLength = 500
    const stripped = stripString(value, maxImageLength)
    setImageValue(stripped)
    setImageLength(countStringLength(stripped))
  }

  return (
    <div className="mx-auto mt-6 mb-6 max-w-7xl rounded-lg border bg-bg p-6">
      <details className="group">
        <summary
          className="flex cursor-pointer select-none items-center justify-between outline-none"
          aria-controls="product-register-form"
          tabIndex={0}
        >
          <span className="flex items-baseline gap-2">
            <span className="font-bold text-lg">商品登録</span>
            <span className="ml-2 text-muted-fg text-xs">
              クリックで開閉します。
            </span>
          </span>
          <span className="ml-2 transition-transform group-open:rotate-180">
            <div className="h-4 w-4 text-muted-fg">
              <ChevronDownIcon />
            </div>
          </span>
        </summary>
        <div id="product-register-form" className="p-4">
          <form method="post">
            <div className="mb-4">
              <label className="mb-1 block font-medium text-fg text-sm">
                商品名
                <input
                  type="text"
                  name="name"
                  className="mt-1 w-full rounded border px-3 py-2 text-fg placeholder:text-muted-fg/80"
                  placeholder="商品名を入力してください"
                  required
                  minLength={1}
                  value={productName}
                  onCompositionStart={() => setIsNameComposing(true)}
                  onCompositionEnd={() => setIsNameComposing(false)}
                  onBeforeInput={(e: InputEvent) => {
                    if (isNameComposing) return
                    const data = e.data ?? ""
                    if (
                      countStringLength(productName + String(data)) >
                      maxNameLength
                    ) {
                      e.preventDefault()
                    }
                  }}
                  onInput={(e) =>
                    handleNameChange((e.target as HTMLInputElement).value)
                  }
                  onPaste={(e) => {
                    e.preventDefault()
                    const paste = e.clipboardData?.getData("text") ?? ""
                    const newVal = stripString(
                      productName + paste,
                      maxNameLength,
                    )
                    handleNameChange(newVal)
                  }}
                />
                <RemainingCounter
                  valueLength={nameLength}
                  maxLength={maxNameLength}
                />
              </label>
            </div>
            <div className="mb-4">
              <label className="mb-1 block font-medium text-fg text-sm">
                画像URL
                <input
                  type="url"
                  name="image"
                  value={imageValue}
                  onCompositionStart={() => setIsImageComposing(true)}
                  onCompositionEnd={() => setIsImageComposing(false)}
                  onBeforeInput={(e: InputEvent) => {
                    if (isImageComposing) return
                    const data = e.data ?? ""
                    if (countStringLength(imageValue + String(data)) > 500) {
                      e.preventDefault()
                    }
                  }}
                  onInput={(e) =>
                    handleImageChange((e.target as HTMLInputElement).value)
                  }
                  onPaste={(e) => {
                    e.preventDefault()
                    const paste = e.clipboardData?.getData("text") ?? ""
                    const newVal = stripString(imageValue + paste, 500)
                    handleImageChange(newVal)
                  }}
                  className="mt-1 w-full rounded border px-3 py-2 text-fg placeholder:text-muted-fg/80"
                  placeholder="https://example.com/image.jpg"
                />
                <RemainingCounter valueLength={imageLength} maxLength={500} />
              </label>
            </div>
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block font-medium text-fg text-sm">
                  価格（円）
                  <input
                    type="number"
                    name="price"
                    className="mt-1 w-full rounded border px-3 py-2 text-fg placeholder:text-muted-fg/80"
                    min={0}
                    step={1}
                    required
                    placeholder="0"
                  />
                </label>
              </div>
              <div className="flex-1">
                <label className="mb-1 block font-medium text-fg text-sm">
                  在庫数
                  <input
                    type="number"
                    name="stock"
                    className="mt-1 w-full rounded border px-3 py-2 text-fg placeholder:text-muted-fg/80"
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
              <div className="mt-1 text-muted-fg/80 text-xs">
                既存タグは一覧からクリックで追加できます。新しいタグも入力して追加できます。
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded border border-primary bg-primary px-3 py-2 font-medium text-primary-fg text-sm transition hover:bg-primary/90"
              >
                登録
              </button>
            </div>
          </form>
        </div>
      </details>
    </div>
  )
}

export default ProductRegister
