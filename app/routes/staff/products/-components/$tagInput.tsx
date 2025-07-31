import { type FC, useState } from "hono/jsx"

type TagInputProps = {
  existingTags: string[]
}

const TagInput: FC<TagInputProps> = ({ existingTags }) => {
  const [tags, setTags] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  function updateSuggestions(value: string) {
    const v = value.trim().toLowerCase()
    setSuggestions(
      v
        ? existingTags.filter(
            (tag) => tag.toLowerCase().includes(v) && !tags.includes(tag),
          )
        : [],
    )
  }

  function addTag(tag?: string) {
    const value = (tag ?? input).trim()
    if (value && !tags.includes(value)) {
      setTags([...tags, value])
      setInput("")
      setSuggestions([])
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  const unselectedTags = existingTags.filter((tag) => !tags.includes(tag))

  return (
    <div>
      <label
        htmlFor="tag-input"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        タグ
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {unselectedTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className="px-2 py-1 rounded border text-xs bg-gray-100 text-gray-700 hover:bg-blue-100 transition"
            onClick={() => addTag(tag)}
            aria-label={`${tag} を追加`}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-2">
        <input
          id="tag-input"
          type="text"
          className="flex-1 border rounded px-3 py-2 placeholder:text-gray-400"
          placeholder="新しいタグを入力"
          value={input}
          autoComplete="off"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={suggestions.length > 0}
          aria-controls="tag-suggestions"
          onInput={(e) => {
            const value = (e.target as HTMLInputElement).value
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
          className="px-3 py-2 rounded bg-blue-600 text-white text-sm font-medium"
          onClick={() => addTag()}
        >
          追加
        </button>
      </div>
      {suggestions.length > 0 && (
        <div
          id="tag-suggestions"
          tabIndex={-1}
          className="border rounded bg-white shadow p-2 mb-2 max-h-40 overflow-auto"
          aria-label="タグ候補"
          aria-live="polite"
        >
          {suggestions.map((tag) => (
            <div
              key={tag}
              className="cursor-pointer px-2 py-1 hover:bg-blue-100 rounded"
              onClick={() => addTag(tag)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") addTag(tag)
              }}
              aria-label={`${tag} を追加`}
            >
              {tag}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2" aria-live="polite">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center border rounded px-2 py-1 text-xs bg-gray-50 text-gray-600"
          >
            {tag}
            <button
              type="button"
              className="ml-1 text-gray-400 hover:text-red-500"
              onClick={() => removeTag(tag)}
              aria-label={`${tag} を削除`}
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
