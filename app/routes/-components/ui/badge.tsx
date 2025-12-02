import type { PropsWithChildren } from "hono/jsx"
import { tv } from "tailwind-variants"

const badgeTv = tv({
  base: "inline-block whitespace-nowrap rounded-full px-3 py-1 font-medium text-xs",
  variants: {
    variant: {
      default: "bg-muted text-muted-fg",
      primary: "bg-primary text-primary-fg",
      secondary: "bg-secondary text-secondary-fg",
      success: "bg-success-subtle text-success-subtle-fg",
      warning: "bg-warning-subtle text-warning-subtle-fg",
      danger: "bg-danger-subtle text-danger-subtle-fg",
      info: "bg-info-subtle text-info-subtle-fg",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

type BadgeProps = PropsWithChildren<{
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
}>

const Badge = ({ variant, children }: BadgeProps) => {
  return <span className={badgeTv({ variant })}>{children}</span>
}

export default Badge
