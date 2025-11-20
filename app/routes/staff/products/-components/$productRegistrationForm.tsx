import { type FC, useCallback, useEffect, useState } from "hono/jsx"
import ChevronLeftIcon from "../../../../components/icons/lucide/chevronLeftIcon"
import SendIcon from "../../../../components/icons/lucide/sendIcon"
import TagIcon from "../../../../components/icons/lucide/tagIcon"
import XIcon from "../../../../components/icons/lucide/xIcon"
import GraphemeInput from "../../../../components/ui/$graphemeInput"
import Button from "../../../../components/ui/button"
import Chip from "../../../../components/ui/chip"
import ChipButton from "../../../../components/ui/chipButton"
import FileInput from "../../../../components/ui/fileInput"
import Input from "../../../../components/ui/input"
import Label from "../../../../components/ui/label"
import LinkButton from "../../../../components/ui/linkButton"
import type Product from "../../../../domain/product/entities/product"
import type ProductTag from "../../../../domain/product/entities/productTag"
import { createHonoClient } from "../../../../helpers/api/hono-client"
import { stripString } from "../../../../utils/text"

type TagInputProps = {
  existingTags: ProductTag[]
  error?: string | null
  isLoading?: boolean
  initialSelected?: string[]
}

const TagInput: FC<TagInputProps> = ({
  existingTags,
  error,
  isLoading,
  initialSelected,
}) => {
  const [tags, setTags] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<ProductTag[]>([])
  const [tagError, setTagError] = useState<string | null>(null)

  const maxTagLength = 50
  const maxTagCount = 20

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

    if (tags.length >= maxTagCount) {
      setTagError(`設定できるタグの個数の上限は${maxTagCount}個です。`)
      return
    }

    if (tags.includes(value)) {
      setTagError("このタグは既に追加されています。")
      return
    }

    setTags([...tags, value])
    setInput("")
    setSuggestions([])
    setTagError(null)
  }

  useEffect(() => {
    if (initialSelected && initialSelected.length > 0) {
      setTags(initialSelected.filter(Boolean))
    }
  }, [initialSelected])

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
    setTagError(null)
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

      <div className="my-1 text-muted-fg text-xs">
        既存タグは一覧からクリックで追加できます。新しいタグも入力して追加できます。
      </div>
      <div className="mb-1">
        {isLoading ? (
          <div className="mb-3 flex items-center justify-center rounded border border-border/50 bg-muted p-6">
            <div className="text-muted-fg text-sm">読み込み中...</div>
          </div>
        ) : error ? (
          <div className="mb-3 flex items-center justify-center rounded border border-border/50 bg-muted p-6">
            <div className="text-muted-fg text-sm">
              タグ一覧の取得に失敗しました。しばらくしてから再試行してください。
            </div>
          </div>
        ) : (
          <div className="flex max-h-35 flex-wrap gap-2 overflow-auto rounded border border-border/50 bg-muted p-2">
            {unselectedTags.map((tag) => (
              <ChipButton key={tag.id} onClick={() => addTag(tag.name)}>
                {tag.name}
              </ChipButton>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <GraphemeInput
            id="tag-input"
            value={input}
            onChange={(v) => {
              setInput(v)
              updateSuggestions(v)
            }}
            maxLength={maxTagLength}
            placeholder="新しいタグを入力"
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addTag()
              }
            }}
          />
        </div>
        <div className="mt-1 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => addTag()}
            ariaLabel="新しいタグを追加"
            disabled={tags.length >= maxTagCount || !input.trim()}
          >
            <div className="size-4">
              <TagIcon />
            </div>
            <span>新しいタグを追加</span>
          </Button>
        </div>
      </div>

      {tagError && (
        <div className="mt-1 text-danger text-sm" role="alert">
          {tagError}
        </div>
      )}

      {suggestions.length > 0 && (
        <div
          id="tag-suggestions"
          tabIndex={-1}
          className="mb-2 flex max-h-40 flex-wrap gap-2 overflow-auto rounded border bg-bg p-2"
          aria-live="polite"
        >
          {suggestions.map((tag) => (
            <ChipButton
              key={tag.id}
              onClick={() => addTag(tag.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") addTag(tag.name)
              }}
              ariaLabel={`${tag.name}を追加`}
            >
              {tag.name}
            </ChipButton>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="my-2 flex flex-wrap gap-2" aria-live="polite">
          {tags.map((tag) => (
            <Chip key={tag}>
              {tag}
              <button
                type="button"
                className="ml-1 cursor-pointer rounded-full p-1 text-muted-fg transition hover:bg-danger-subtle hover:text-danger"
                onClick={() => removeTag(tag)}
                aria-label={`${tag}を削除`}
              >
                <div className="size-3">
                  <XIcon />
                </div>
              </button>
              <input type="hidden" name="tags" value={tag} />
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}

type ProductFormProps = {
  initialValues?: Partial<Product>
  mode?: "create" | "edit"
}

const ProductRegistrationForm: FC<ProductFormProps> = ({
  initialValues,
  mode = "create",
}) => {
  const [productName, setProductName] = useState(initialValues?.name ?? "")
  const [priceValue, setPriceValue] = useState<string | undefined>(
    initialValues?.price !== undefined
      ? String(initialValues.price)
      : undefined,
  )
  const [stockValue, setStockValue] = useState<string | undefined>(
    initialValues?.stock !== undefined
      ? String(initialValues.stock)
      : undefined,
  )
  const [tags, setTags] = useState<ProductTag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const honoClient = createHonoClient()
      const response = await honoClient["product-registration-form"].$get()
      if (!response.ok) {
        throw new Error(
          `Failed to fetch tags: ${response.status} ${response.statusText}`,
        )
      }
      const { tags: fetchedTags } = await response.json()
      setTags(fetchedTags)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const maxNameLength = 50
  const heading = mode === "edit" ? "商品編集" : "商品登録"
  const submitLabel = mode === "edit" ? "商品を更新" : "商品を登録"

  return (
    <div className="mx-auto max-w-7xl rounded-lg border bg-bg p-6">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-bold text-lg">{heading}</span>
        </div>
        <div id="product-register-form" className="p-4">
          <form method="post" encType="multipart/form-data">
            <div className="mb-4">
              <Label htmlFor="productName" required>
                商品名
              </Label>
              <GraphemeInput
                id="productName"
                name="name"
                value={productName}
                onChange={setProductName}
                maxLength={maxNameLength}
                placeholder="商品名"
                required
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="imageFile">商品画像</Label>
              <div className="my-1 text-muted-fg text-xs">
                対応形式: JPEG, PNG, GIF, WebP (約7.5MB以下)
              </div>
              <FileInput
                id="imageFile"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              />
            </div>
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <Label htmlFor="price" required>
                  価格（円）
                </Label>
                <Input
                  id="price"
                  type="number"
                  name="price"
                  min={0}
                  step={1}
                  required
                  placeholder="0"
                  value={priceValue}
                  onChange={(e: Event) =>
                    setPriceValue((e.target as HTMLInputElement).value)
                  }
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="stock" required>
                  在庫数
                </Label>
                <Input
                  id="stock"
                  type="number"
                  name="stock"
                  min={0}
                  step={1}
                  required
                  placeholder="0"
                  value={stockValue}
                  onChange={(e: Event) =>
                    setStockValue((e.target as HTMLInputElement).value)
                  }
                />
              </div>
            </div>
            <div className="mb-4">
              <TagInput
                existingTags={tags}
                error={error}
                isLoading={isLoading}
                initialSelected={
                  initialValues?.tagIds && tags.length > 0
                    ? tags
                        .filter((t) =>
                          initialValues.tagIds?.some((id) => id === t.id),
                        )
                        .map((t) => t.name)
                    : undefined
                }
              />
            </div>
            <div className="mt-6 flex gap-4">
              {mode === "edit" ? (
                <div>
                  <LinkButton href="/staff/products" leftIcon={ChevronLeftIcon}>
                    商品管理に戻る
                  </LinkButton>
                </div>
              ) : null}
              <div className="ml-auto">
                <Button type="submit" leftIcon={SendIcon}>
                  <span>{submitLabel}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProductRegistrationForm
