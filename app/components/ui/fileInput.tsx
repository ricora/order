import type { FC } from "hono/jsx"

type FileInputProps = {
  id?: string
  name?: string
  accept?: string
  required?: boolean
  onChange?: (e: Event) => void
}

const FileInput: FC<FileInputProps> = ({
  id,
  name,
  accept,
  required,
  onChange,
}) => {
  return (
    <input
      id={id}
      name={name}
      type="file"
      accept={accept}
      required={required}
      onChange={onChange}
      className="mt-1 w-full cursor-pointer rounded border border-input bg-bg px-3 py-2 text-fg text-sm file:mr-3 file:cursor-pointer file:rounded file:border file:border-border file:bg-muted file:px-2 file:py-1 file:font-medium file:text-secondary-fg file:text-sm file:transition hover:file:border-primary-subtle hover:file:bg-primary-subtle hover:file:text-primary-subtle-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-subtle"
    />
  )
}

export default FileInput
