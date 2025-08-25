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
      "flex items-center min-w-[240px] max-w-[400px] p-4 rounded-lg shadow-lg border",
    icon: "inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg",
    text: "ml-3 text-sm font-normal break-words",
  },
  variants: {
    type: {
      success: {
        container: "bg-emerald-50 border-emerald-400",
        icon: "text-emerald-600",
        text: "text-emerald-600",
      },
      error: {
        container: "bg-rose-50 border-rose-400",
        icon: "text-rose-600",
        text: "text-rose-600",
      },
      warning: {
        container: "bg-amber-50 border-amber-400",
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
