import { type FC, useState } from "hono/jsx"
import type ProductTag from "../../../../domain/product/entities/productTag"
import { stripString } from "../../../../utils/text"

type TagInputProps = {
  existingTags: ProductTag[]
}

const TagInput: FC<TagInputProps> = ({ existingTags }) => {
  const [tags, setTags] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<ProductTag[]>([])

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
    const value = (tagName ?? input).trim()
    if (value && !tags.includes(value)) {
      setTags([...tags, value])
      setInput("")
      setSuggestions([])
    }
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
      <div className="mb-2 flex flex-wrap gap-2">
        {unselectedTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className="rounded border border-border bg-muted px-2 py-1 text-fg text-xs transition hover:bg-primary-subtle"
            onClick={() => addTag(tag.name)}
            aria-label={`${tag.name}を追加`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <div className="mb-2 flex gap-2">
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
          onInput={(e) => {
            const value = stripString((e.target as HTMLInputElement).value, 50)
            setInput(value)
            updateSuggestions(value)
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
      {suggestions.length > 0 && (
        <div
          id="tag-suggestions"
          tabIndex={-1}
          className="mb-2 max-h-40 overflow-auto rounded border border-border bg-bg p-2 shadow"
          aria-live="polite"
        >
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="cursor-pointer rounded px-2 py-1 transition hover:bg-primary-subtle"
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
            className="flex items-center rounded border border-border bg-muted px-2 py-1 text-muted-fg text-xs"
          >
            {tag}
            <button
              type="button"
              className="ml-1 text-muted-fg/80 transition hover:text-danger"
              onClick={() => removeTag(tag)}
              aria-label={`${tag}を削除`}
            >
              ×
            </button>
            <input type="hidden" name="tags" value={tag} />
          </span>
        ))}
      </div>
    </div>
  )
}

export default TagInput
