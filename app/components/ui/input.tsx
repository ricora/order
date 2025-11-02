import type { FC } from "hono/jsx"

type InputProps = {
  id?: string
  name?: string
  type?: "text" | "url" | "search" | "tel" | "email" | "number"
  value?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  min?: number
  max?: number
  step?: number
  onChange?: (e: Event) => void
  onInput?: (e: Event) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onBeforeInput?: (e: InputEvent) => void
  onCompositionStart?: () => void
  onCompositionEnd?: () => void
  onPaste?: (e: ClipboardEvent) => void
}

const Input: FC<InputProps> = ({
  id,
  name,
  type = "text",
  value,
  defaultValue,
  placeholder,
  required,
  min,
  max,
  step,
  onChange,
  onInput,
  onKeyDown,
  onBeforeInput,
  onCompositionStart,
  onCompositionEnd,
  onPaste,
}) => {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onBeforeInput={onBeforeInput}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onPaste={onPaste}
      className={
        "mt-1 w-full rounded border px-3 py-2 text-fg text-sm placeholder:text-muted-fg/80 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-subtle"
      }
    />
  )
}

export default Input
