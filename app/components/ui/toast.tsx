import { css, keyframes } from "hono/css"
import type { FC } from "hono/jsx"
import { tv, type VariantProps } from "tailwind-variants"
import CircleCheckIcon from "../icons/lucide/circleCheckIcon"
import CircleXIcon from "../icons/lucide/circleXIcon"
import TriangleAlertIcon from "../icons/lucide/triangleAlertIcon"

const toastIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`
const toastOut = keyframes`
  to {
    opacity: 0;
    transform: translateY(20px);
  }
`

const toastAnimate = css`
  animation-name: ${toastIn}, ${toastOut};
  animation-duration: 0.3s, 0.5s;
  animation-delay: 0s, 2.5s;
  animation-fill-mode: forwards;
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
`

export const toast = tv({
  slots: {
    container:
      "flex min-w-60 max-w-[400px] items-center rounded-lg border bg-bg p-4 shadow-lg",
    icon: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
    text: "wrap-break-word ml-3 font-normal text-sm",
  },
  variants: {
    type: {
      success: {
        container: "border-success-subtle bg-success-subtle",
        icon: "text-success-subtle-fg",
        text: "text-success-subtle-fg",
      },
      error: {
        container: "border-danger-subtle bg-danger-subtle",
        icon: "text-danger-subtle-fg",
        text: "text-danger-subtle-fg",
      },
      warning: {
        container: "border-warning-subtle bg-warning-subtle",
        icon: "text-warning-subtle-fg",
        text: "text-warning-subtle-fg",
      },
    },
  },
  defaultVariants: {
    type: "success",
  },
})

export type ToastVariants = VariantProps<typeof toast>

export type ToastProps = ToastVariants & { message: string }

const Toast: FC<ToastProps> = ({ message, type }) => {
  const { container, icon, text } = toast({ type })
  return (
    <div class={toastAnimate}>
      <div class="rounded-lg bg-bg shadow-lg">
        <div class={container()} role="alert">
          <div class={icon()}>
            <div class="size-5">
              {type === "error" ? (
                <CircleXIcon />
              ) : type === "warning" ? (
                <TriangleAlertIcon />
              ) : (
                <CircleCheckIcon />
              )}
            </div>
          </div>
          <div class={text()}>{message}</div>
        </div>
      </div>
    </div>
  )
}

export default Toast
