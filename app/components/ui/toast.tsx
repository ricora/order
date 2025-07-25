import { css, keyframes } from "hono/css"
import type { FC } from "hono/jsx"
import CircleCheckIcon from "../icons/lucide/circleCheckIcon"
import CircleXIcon from "../icons/lucide/circleXIcon"
import TriangleAlertIcon from "../icons/lucide/triangleAlertIcon"

const COLORS = {
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-400",
    icon: "text-emerald-600",
  },
  error: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-400",
    icon: "text-rose-600",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-400",
    icon: "text-amber-600",
  },
}

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

const Toast: FC<{
  message: string
  type?: "success" | "error" | "warning"
}> = ({ message, type = "success" }) => {
  const color = COLORS[type]
  return (
    <div class={toastAnimate}>
      <div
        class={`flex items-center min-w-[240px] max-w-[400px] p-4 rounded-lg shadow-lg border
          ${color.bg} ${color.border}`}
        role="alert"
      >
        <div
          class={`inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg ${color.icon}`}
        >
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
        <div class={`ml-3 text-sm font-normal ${color.text} break-words`}>
          {message}
        </div>
      </div>
    </div>
  )
}

export default Toast
