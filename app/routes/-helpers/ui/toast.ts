import type { Context } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

export const setToastCookie = (
  c: Context,
  type: "success" | "error" | "warning",
  message: string,
) => {
  setCookie(c, "toastType", type)
  setCookie(c, "toastMessage", message)
}

export const getToastCookie = (
  c: Context,
): { toastType?: "success" | "error" | "warning"; toastMessage?: string } => {
  const toastType = getCookie(c, "toastType") as
    | "success"
    | "error"
    | "warning"
    | undefined
  const toastMessage = getCookie(c, "toastMessage")
  return { toastType, toastMessage }
}

export const deleteToastCookie = (c: Context) => {
  deleteCookie(c, "toastType")
  deleteCookie(c, "toastMessage")
}
