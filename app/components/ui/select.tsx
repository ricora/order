import type { FC } from "hono/jsx"
import { tv } from "tailwind-variants"

type Option = {
  value: string | number
  label: string
  disabled?: boolean
  selected?: boolean
}

type SelectProps = {
  id?: string
  name?: string
  required?: boolean
  options: Option[]
  variant?: "primary" | "secondary" | "danger"
  disabled?: boolean
}

const selectTv = tv({
  base: "mt-1 block w-full rounded border border-input px-3 py-2 text-fg text-sm placeholder:text-muted-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-subtle",
  variants: {
    variant: {
      primary: "",
      secondary: "bg-muted text-secondary-fg",
      danger: "border-danger",
    },
    isDisabled: {
      true: "cursor-not-allowed border-border bg-muted text-muted-fg opacity-80",
      false: "cursor-pointer",
    },
  },
  defaultVariants: {
    variant: "primary",
    isDisabled: false,
  },
})

const Select: FC<SelectProps> = ({
  id,
  name,
  required,
  options,
  variant = "primary",
  disabled = false,
}) => {
  return (
    <select
      id={id}
      name={name}
      required={required}
      disabled={disabled}
      className={selectTv({ variant, isDisabled: disabled })}
    >
      {options.map((opt) => (
        <option
          key={String(opt.value)}
          value={String(opt.value)}
          disabled={opt.disabled}
          selected={opt.selected}
        >
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export default Select
