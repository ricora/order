import type { PropsWithChildren } from "hono/jsx"
import { tv } from "tailwind-variants"

const chipTv = tv({
  base: "inline-flex items-center whitespace-nowrap rounded border bg-muted px-2 text-muted-fg transition",
  variants: {
    size: {
      sm: "py-1 text-sm",
      xs: "py-0.5 text-xs",
    },
  },
  defaultVariants: {
    size: "sm",
  },
})

type ChipProps = PropsWithChildren<{
  size?: "sm" | "xs"
}>

const Chip = ({ children, size = "sm" }: ChipProps) => {
  return <span className={chipTv({ size })}>{children}</span>
}

export default Chip
