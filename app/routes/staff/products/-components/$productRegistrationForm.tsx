import { type FC, useEffect, useState } from "hono/jsx"
import ChevronDownIcon from "../../../../components/icons/lucide/chevronDownIcon"
import SendIcon from "../../../../components/icons/lucide/sendIcon"
import TagIcon from "../../../../components/icons/lucide/tagIcon"
import XIcon from "../../../../components/icons/lucide/xIcon"
import GraphemeInput from "../../../../components/ui/$graphemeInput"
import Button from "../../../../components/ui/button"
import Chip from "../../../../components/ui/chip"
import ChipButton from "../../../../components/ui/chipButton"
import Input from "../../../../components/ui/input"
import Label from "../../../../components/ui/label"
import type ProductTag from "../../../../domain/product/entities/productTag"
import { createHonoClient } from "../../../../helpers/hono/hono-client"
import { stripString } from "../../../../utils/text"

type TagInputProps = {
  existingTags: ProductTag[]
}

const TagInput: FC<TagInputProps> = ({ existingTags }) => {
  const [tags, setTags] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<ProductTag[]>([])

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

      <div className="my-1 text-muted-fg text-xs">
        既存タグは一覧からクリックで追加できます。新しいタグも入力して追加できます。
      </div>
      <div className="mb-1 flex max-h-35 flex-wrap gap-2 overflow-auto rounded border border-border/50 bg-muted p-2">
        {unselectedTags.map((tag) => (
          <ChipButton key={tag.id} onClick={() => addTag(tag.name)}>
            {tag.name}
          </ChipButton>
        ))}
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
        <div className="mt-1 flex-shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => addTag()}
            ariaLabel="新しいタグを追加"
          >
            <div className="size-4">
              <TagIcon />
            </div>
            <span>新しいタグを追加</span>
          </Button>
        </div>
      </div>

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
                className="ml-1 cursor-pointer rounded-full p-1 text-muted-fg/80 transition hover:bg-danger-subtle hover:text-danger"
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

const ProductRegistrationForm = () => {
  const [productName, setProductName] = useState("")
  const [imageValue, setImageValue] = useState("")
  const [tags, setTags] = useState<ProductTag[]>([])

  const fetchTags = async () => {
    const honoClient = createHonoClient()
    const response = await honoClient["product-registration-form"].$get()
    const { tags: fetchedTags } = await response.json()
    setTags(fetchedTags)
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const maxNameLength = 50

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
              <Label htmlFor="imageUrl">画像URL</Label>
              <GraphemeInput
                id="imageUrl"
                name="image"
                type="url"
                value={imageValue}
                onChange={setImageValue}
                maxLength={500}
                placeholder="https://example.com/image.jpg"
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
                />
              </div>
            </div>
            <div className="mb-4">
              <TagInput existingTags={tags} />
            </div>
            <div className="mt-6 flex gap-4">
              <div className="ml-auto">
                <Button type="submit">
                  <div className="size-4">
                    <SendIcon />
                  </div>
                  <span>商品を登録</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </details>
    </div>
  )
}

export default ProductRegistrationForm
