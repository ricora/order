import type { FC, PropsWithChildren } from "hono/jsx"
import { tv } from "tailwind-variants"
import CircleCheckIcon from "../icons/lucide/circleCheckIcon"
import CircleXIcon from "../icons/lucide/circleXIcon"
import InfoIcon from "../icons/lucide/infoIcon"
import TriangleAlertIcon from "../icons/lucide/triangleAlertIcon"

const variantIcons = {
  info: InfoIcon,
  warning: TriangleAlertIcon,
  success: CircleCheckIcon,
  danger: CircleXIcon,
} as const

const calloutTv = tv({
  slots: {
    root: "rounded-lg border px-6 py-4",
    container: "flex flex-col gap-3",
    header: "flex items-center gap-3",
    iconWrapper: "flex items-center justify-center rounded-lg",
    icon: "h-5 w-5",
    title: "font-bold",
    content: "text-sm",
  },
  variants: {
    variant: {
      info: {
        root: "border-info-subtle bg-info-subtle",
        icon: "text-info-subtle-fg",
        title: "text-info-subtle-fg",
        content: "text-info-subtle-fg",
      },
      warning: {
        root: "border-warning-subtle bg-warning-subtle",
        icon: "text-warning-subtle-fg",
        title: "text-warning-subtle-fg",
        content: "text-warning-subtle-fg",
      },
      success: {
        root: "border-success-subtle bg-success-subtle",
        icon: "text-success-subtle-fg",
        title: "text-success-subtle-fg",
        content: "text-success-subtle-fg",
      },
      danger: {
        root: "border-danger-subtle bg-danger-subtle",
        icon: "text-danger-subtle-fg",
        title: "text-danger-subtle-fg",
        content: "text-danger-subtle-fg",
      },
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

type CalloutProps = PropsWithChildren<{
  variant?: "info" | "warning" | "success" | "danger"
  title?: string
}>

const Callout: FC<CalloutProps> = ({ variant = "info", title, children }) => {
  const styles = calloutTv({ variant })
  const Icon = variantIcons[variant]

  return (
    <div class={styles.root()}>
      <div class={styles.container()}>
        <div class={styles.header()}>
          <div class={styles.iconWrapper()}>
            <div class={styles.icon()}>
              <Icon />
            </div>
          </div>
          {title && <h3 class={styles.title()}>{title}</h3>}
        </div>
        <div class={styles.content()}>{children}</div>
      </div>
    </div>
  )
}

export default Callout
