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
      "flex min-w-[240px] max-w-[400px] items-center rounded-lg border p-4 shadow-lg",
    icon: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
    text: "ml-3 break-words font-normal text-sm",
  },
  variants: {
    type: {
      success: {
        container: "border-emerald-400 bg-emerald-50",
        icon: "text-emerald-600",
        text: "text-emerald-600",
      },
      error: {
        container: "border-rose-400 bg-rose-50",
        icon: "text-rose-600",
        text: "text-rose-600",
      },
      warning: {
        container: "border-amber-400 bg-amber-50",
        icon: "text-amber-600",
        text: "text-amber-600",
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
  )
}

export default Toast
