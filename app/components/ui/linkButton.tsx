import type { FC, PropsWithChildren } from "hono/jsx"
import { tv } from "tailwind-variants"

const linkButtonTv = tv({
  base: "inline-flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 font-medium text-sm transition",
  variants: {
    kind: {
      default: "border-border bg-bg text-fg hover:bg-muted",
      danger:
        "border-border bg-bg text-danger-subtle-fg hover:border-danger-subtle hover:bg-danger-subtle",
    },
    layout: {
      default: "",
      full: "flex flex-1 items-center justify-center",
    },
    disabled: {
      true: "pointer-events-none cursor-not-allowed border-border/50 bg-muted/50 text-muted-fg opacity-80",
      false: "",
    },
  },
  defaultVariants: { kind: "default", layout: "default", disabled: false },
})

type LinkButtonProps = PropsWithChildren<{
  href: string
  leftIcon?: FC
  rightIcon?: FC
  kind?: "default" | "danger"
  layout?: "default" | "full"
  disabled?: boolean
  ariaLabel?: string
}>

export default function LinkButton({
  href,
  children,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  kind = "default",
  layout = "default",
  disabled = false,
  ariaLabel,
}: LinkButtonProps) {
  const cls = linkButtonTv({ kind, layout, disabled })

  return (
    <a
      href={href}
      className={cls}
      aria-disabled={disabled}
      aria-label={ariaLabel}
    >
      {LeftIcon ? (
        <div className="h-4 w-4">
          <LeftIcon />
        </div>
      ) : null}
      {children}
      {RightIcon ? (
        <div className="h-4 w-4">
          <RightIcon />
        </div>
      ) : null}
    </a>
  )
}
