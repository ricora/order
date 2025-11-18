import type { FC, PropsWithChildren } from "hono/jsx"
import { tv } from "tailwind-variants"

type ButtonProps = PropsWithChildren<{
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  leftIcon?: FC
  variant?: "primary" | "secondary" | "danger"
  onClick?: (e: Event) => void
  ariaLabel?: string
}>

const buttonTv = tv({
  base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded border px-3 py-2 font-medium text-sm transition",
  variants: {
    variant: {
      primary: "border-primary bg-primary text-primary-fg",
      secondary: "bg-muted text-secondary-fg",
      danger: "bg-muted text-danger-subtle-fg",
    },
    isDisabled: {
      true: "cursor-not-allowed border-border bg-muted text-muted-fg opacity-80",
      false: "cursor-pointer",
    },
  },
  compoundVariants: [
    { variant: "primary", isDisabled: false, class: "hover:bg-primary/90" },
    {
      variant: "secondary",
      isDisabled: false,
      class:
        "hover:border-primary-subtle hover:bg-primary-subtle hover:text-primary-subtle-fg",
    },
    {
      variant: "danger",
      isDisabled: false,
      class: "hover:border-danger-subtle hover:bg-danger-subtle",
    },
  ],
  defaultVariants: {
    variant: "primary",
    isDisabled: false,
  },
})

const Button = ({
  type = "button",
  disabled = false,
  variant = "primary",
  children,
  onClick,
  ariaLabel,
  leftIcon: LeftIcon,
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={buttonTv({ variant, isDisabled: disabled })}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {LeftIcon ? (
        <div className="h-4 w-4">
          <LeftIcon />
        </div>
      ) : null}
      {children}
    </button>
  )
}

export default Button
