import type { FC, PropsWithChildren } from "hono/jsx"

type LabelProps = PropsWithChildren<{
  htmlFor?: string
  required?: boolean
}>

const Label: FC<LabelProps> = ({ htmlFor, children, required = false }) => {
  return (
    <label htmlFor={htmlFor} className="mb-1 block font-medium text-fg text-sm">
      <span className="flex items-center">
        {children}
        {required && (
          <span className="ml-1 text-danger" aria-hidden>
            *
          </span>
        )}
      </span>
      {required && <span className="sr-only">必須</span>}
    </label>
  )
}

export default Label
