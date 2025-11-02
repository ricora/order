import { type FC, useState } from "hono/jsx"
import { countStringLength, stripString } from "../../utils/text"
import Input from "./input"

type GraphemeInputProps = {
  id?: string
  name?: string
  value: string
  onChange: (v: string) => void
  maxLength: number
  placeholder?: string
  type?: "text" | "url" | "search" | "tel" | "email"
  showRemaining?: boolean
  required?: boolean
  onKeyDown?: (e: KeyboardEvent) => void
}

const GraphemeInput: FC<GraphemeInputProps> = ({
  id,
  name,
  value,
  onChange,
  maxLength,
  placeholder,
  onKeyDown,
  required,

  type = "text",
  showRemaining = true,
}) => {
  const [isComposing, setIsComposing] = useState(false)

  const remaining = Math.max(0, maxLength - countStringLength(value || ""))

  return (
    <div>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
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
        onInput={(e) => {
          const raw = (e.target as HTMLInputElement).value
          const stripped = stripString(raw, maxLength)
          onChange(stripped)
        }}
        onPaste={(e) => {
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

export default GraphemeInput
