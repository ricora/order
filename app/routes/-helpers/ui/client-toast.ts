/**
 * トーストの種類
 */
export type ToastType = "success" | "error" | "warning"

type ToastHandler = (type: ToastType, message: string) => void

const handlers = new Set<ToastHandler>()

/**
 * トースト通知のリスナーを登録する。
 *
 * @param handler 登録するリスナー関数
 */
export const onToast = (handler: ToastHandler) => handlers.add(handler)

/**
 * トースト通知のリスナー登録を解除する。
 *
 * @param handler 解除するリスナー関数
 */
export const offToast = (handler: ToastHandler) => handlers.delete(handler)

/**
 * クライアントで動的にトーストを表示する。
 *
 * @param type トーストの種類
 * @param message 表示するメッセージ
 */
export const showToast = (type: ToastType, message: string) => {
  if (typeof window === "undefined") return
  try {
    handlers.forEach((handler) => {
      handler(type, message)
    })
  } catch {
    // リスナー内の例外は無視する
  }
}
