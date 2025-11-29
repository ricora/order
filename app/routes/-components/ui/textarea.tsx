import type { FC } from "hono/jsx"

type TextareaProps = {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  rows?: number
  onChange?: (e: Event) => void
  onInput?: (e: Event) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onBeforeInput?: (e: InputEvent) => void
  onCompositionStart?: () => void
  onCompositionEnd?: () => void
  onPaste?: (e: ClipboardEvent) => void
}

const Textarea: FC<TextareaProps> = ({
  id,
  name,
  value,
  defaultValue,
  placeholder,
  required,
  rows = 3,
  onChange,
  onInput,
  onKeyDown,
  onBeforeInput,
  onCompositionStart,
  onCompositionEnd,
  onPaste,
}) => {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      rows={rows}
      onChange={onChange}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onBeforeInput={onBeforeInput}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onPaste={onPaste}
      className="mt-1 w-full resize-none rounded border border-input px-3 py-2 text-fg text-sm placeholder:text-muted-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-subtle"
    />
  )
}

export default Textarea
