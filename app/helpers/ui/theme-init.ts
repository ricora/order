import {
  applyColorScheme,
  DEFAULT_COLOR_SCHEME,
  getStoredColorScheme,
  resolveColorScheme,
  setStoredColorScheme,
} from "./theme"

export const initColorScheme = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return
  }

  const stored = getStoredColorScheme()
  const scheme = stored ?? DEFAULT_COLOR_SCHEME
  const resolved = resolveColorScheme(scheme)

  applyColorScheme(resolved)

  if (stored === null) {
    setStoredColorScheme(DEFAULT_COLOR_SCHEME)
  }
}
