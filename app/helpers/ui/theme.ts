export type ColorScheme = "light" | "dark" | "auto"
export type ResolvedColorScheme = "light" | "dark"

export const COLOR_SCHEMES: ReadonlyArray<ColorScheme> = [
  "light",
  "dark",
  "auto",
] as const
export const DEFAULT_COLOR_SCHEME: ColorScheme = "auto"
export const PREFERS_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
export const THEME_STORAGE_KEY = "color-scheme"

export const isColorScheme = (value: unknown): value is ColorScheme => {
  if (typeof value !== "string") return false
  return (COLOR_SCHEMES as readonly string[]).includes(value)
}

export const getSystemColorScheme = (): ResolvedColorScheme => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia(PREFERS_COLOR_SCHEME_QUERY).matches
  ) {
    return "dark"
  }
  return "light"
}

export const getStoredColorScheme = (
  storage?: Pick<Storage, "getItem"> | null,
): ColorScheme | null => {
  const target =
    storage ?? (typeof window !== "undefined" ? window.localStorage : null)
  if (!target) return null
  try {
    const stored = target.getItem(THEME_STORAGE_KEY)
    if (isColorScheme(stored)) {
      return stored
    }
  } catch {
    // Access to storage can fail (Safari private mode, etc)
  }
  return null
}

export const setStoredColorScheme = (
  scheme: ColorScheme,
  storage?: Pick<Storage, "setItem"> | null,
): void => {
  const target =
    storage ?? (typeof window !== "undefined" ? window.localStorage : null)
  if (!target) return
  try {
    target.setItem(THEME_STORAGE_KEY, scheme)
  } catch {
    // Ignore storage write failures
  }
}

export const resolveColorScheme = (
  scheme: ColorScheme,
  systemScheme: ResolvedColorScheme = getSystemColorScheme(),
): ResolvedColorScheme => {
  if (scheme === "auto") {
    return systemScheme
  }
  return scheme
}

export const applyColorScheme = (
  scheme: ResolvedColorScheme,
  root?: Element | null,
): void => {
  const target =
    root ?? (typeof document !== "undefined" ? document.documentElement : null)
  if (!target) return
  if (scheme === "dark") {
    target.classList.add("dark")
  } else {
    target.classList.remove("dark")
  }
}

export const readColorSchemePreference = (
  storage?: Pick<Storage, "getItem"> | null,
): ColorScheme => {
  return getStoredColorScheme(storage) ?? DEFAULT_COLOR_SCHEME
}

export const initColorScheme = (): void => {
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
