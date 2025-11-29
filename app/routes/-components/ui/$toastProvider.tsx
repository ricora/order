import { useEffect, useState } from "hono/jsx"
import type { ToastType } from "../../-helpers/ui/client-toast"
import { offToast, onToast } from "../../-helpers/ui/client-toast"
import Toast from "./toast"

type ToastItem = { id: number; type: ToastType; message: string }

/**
 * クライアントで動的にトースト通知を表示するためのProviderコンポーネント。
 */
export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    let nextId = 1

    const handler = (type: ToastType, message: string) => {
      const id = nextId++
      const item: ToastItem = { id, type, message }
      setToasts((s) => [...s, item])
      setTimeout(() => {
        setToasts((s) => s.filter((t) => t.id !== id))
      }, 3000)
    }
    onToast(handler)
    return () => offToast(handler)
  }, [])

  if (!toasts.length) return null
  return (
    <div class="fixed right-4 bottom-4 z-50 flex max-w-[420px] flex-col items-end gap-2">
      {toasts.map((t) => (
        <div key={String(t.id)} class="w-max self-end">
          <Toast message={t.message} type={t.type} />
        </div>
      ))}
    </div>
  )
}
