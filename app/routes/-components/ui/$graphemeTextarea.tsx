import { type FC, useState } from "hono/jsx"
import { countStringLength, stripString } from "../../../utils/text"
import Textarea from "./textarea"

type GraphemeTextareaProps = {
  id?: string
  name?: string
  value: string
  onChange: (v: string) => void
  maxLength: number
  placeholder?: string
  showRemaining?: boolean
  required?: boolean
  rows?: number
  onKeyDown?: (e: KeyboardEvent) => void
}

const GraphemeTextarea: FC<GraphemeTextareaProps> = ({
  id,
  name,
  value,
  onChange,
  maxLength,
  placeholder,
  onKeyDown,
  required,
  rows = 3,
  showRemaining = true,
}) => {
  const [isComposing, setIsComposing] = useState(false)

  const remaining = Math.max(0, maxLength - countStringLength(value || ""))

  return (
    <div>
      <Textarea
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        rows={rows}
        onKeyDown={onKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onBeforeInput={(e: InputEvent) => {
          if (isComposing) return
          const data = e.data ?? ""
          if (countStringLength(String(value) + String(data)) > maxLength) {
            e.preventDefault()
          }
        }}
        onInput={(e: Event) => {
          const raw = (e.target as HTMLTextAreaElement).value
          const stripped = stripString(raw, maxLength)
          onChange(stripped)
        }}
        onPaste={(e: ClipboardEvent) => {
          e.preventDefault()
          const paste = e.clipboardData?.getData("text") ?? ""
          const newVal = stripString(String(value) + paste, maxLength)
          onChange(newVal)
        }}
      />

      {showRemaining && (
        <div className="my-1 text-muted-fg text-xs" aria-live="polite">
          残り{remaining}文字
        </div>
      )}
    </div>
  )
}

export default GraphemeTextarea
