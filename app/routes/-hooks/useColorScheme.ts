import { useEffect, useState } from "hono/jsx"
import {
  applyColorScheme,
  type ColorScheme,
  PREFERS_COLOR_SCHEME_QUERY,
  type ResolvedColorScheme,
  readColorSchemePreference,
  resolveColorScheme,
  setStoredColorScheme,
  THEME_STORAGE_KEY,
} from "../../helpers/ui/color-scheme"

const COLOR_SCHEME_EVENT = "color-scheme:change"

const emitColorSchemeChange = (): void => {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(COLOR_SCHEME_EVENT))
}

const subscribeToColorSchemeChange = (handler: () => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  const listener = () => handler()
  window.addEventListener(COLOR_SCHEME_EVENT, listener)
  return () => window.removeEventListener(COLOR_SCHEME_EVENT, listener)
}

const getStoredPreference = (): ColorScheme => {
  return readColorSchemePreference()
}

export const useColorScheme = () => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    return getStoredPreference()
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const syncFromStorage = () => {
      const scheme = getStoredPreference()
      setColorSchemeState(scheme)
      applyColorScheme(resolveColorScheme(scheme))
    }

    syncFromStorage()

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      syncFromStorage()
    }

    const unsubscribe = subscribeToColorSchemeChange(syncFromStorage)

    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
      unsubscribe()
    }
  }, [])

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    if (typeof window === "undefined") return
    setStoredColorScheme(scheme)
    applyColorScheme(resolveColorScheme(scheme))
    emitColorSchemeChange()
  }

  return { colorScheme, setColorScheme }
}

export const useResolvedColorScheme = () => {
  const [resolvedScheme, setResolvedScheme] = useState<ResolvedColorScheme>(
    () => resolveColorScheme(getStoredPreference()),
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const applyFromPreference = () => {
      const scheme = getStoredPreference()
      const resolved = resolveColorScheme(scheme)
      setResolvedScheme(resolved)
      applyColorScheme(resolved)
    }

    applyFromPreference()

    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia(PREFERS_COLOR_SCHEME_QUERY)
        : null

    const handleMediaChange = () => {
      if (getStoredPreference() === "auto") {
        applyFromPreference()
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      applyFromPreference()
    }

    const unsubscribe = subscribeToColorSchemeChange(applyFromPreference)

    mediaQuery?.addEventListener("change", handleMediaChange)
    window.addEventListener("storage", handleStorage)

    return () => {
      mediaQuery?.removeEventListener("change", handleMediaChange)
      window.removeEventListener("storage", handleStorage)
      unsubscribe()
    }
  }, [])

  return { resolvedScheme }
}
