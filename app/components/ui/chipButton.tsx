import type { PropsWithChildren } from "hono/jsx"
import { tv } from "tailwind-variants"

const chipButtonTv = tv({
  base: "cursor-pointer rounded border px-2 py-1 text-sm transition",
  variants: {
    isActive: {
      true: "border-primary bg-primary text-primary-fg",
      false:
        "bg-bg text-secondary-fg hover:border-primary-subtle hover:bg-primary-subtle hover:text-primary-subtle-fg",
    },
  },
  defaultVariants: {
    isActive: false,
  },
})

type ChipButtonProps = PropsWithChildren<{
  isActive?: boolean
  onClick?: (e?: Event) => void
  onKeyDown?: (e: KeyboardEvent) => void
  ariaLabel?: string
}>

const ChipButton = ({
  children,
  isActive = false,
  onClick,
  onKeyDown,
  ariaLabel,
}: ChipButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      className={chipButtonTv({ isActive })}
    >
      {children}
    </button>
  )
}

export default ChipButton
