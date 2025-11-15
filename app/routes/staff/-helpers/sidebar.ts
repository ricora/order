export const DESKTOP_SIDEBAR_TOGGLE_BUTTON_ID =
  "staff-desktop-sidebar-toggle-button"
export const MAIN_CONTENT_ID = "staff-main-content"

export const SIDEBAR_STATE_STORAGE_KEY = "staff-sidebar-open"
export const SIDEBAR_STATE_ATTRIBUTE = "data-staff-sidebar-state"
export const SIDEBAR_STATE_DATASET_PROP = "staffSidebarState"

export type SidebarState = "open" | "closed"
export const DEFAULT_SIDEBAR_STATE: SidebarState = "open"

export const readSidebarStateFromStorage = (): SidebarState => {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_STATE
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STATE_STORAGE_KEY)
    if (stored === "closed") {
      return "closed"
    }
    if (stored === "open") {
      return "open"
    }
  } catch {
    // ignore if localStorage is unavailable
  }
  return DEFAULT_SIDEBAR_STATE
}

export const writeSidebarState = (
  state: SidebarState,
  { persist = true }: { persist?: boolean } = {},
) => {
  if (typeof document !== "undefined") {
    document.documentElement.dataset[SIDEBAR_STATE_DATASET_PROP] = state
  }

  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SIDEBAR_STATE_STORAGE_KEY, state)
    } catch {
      // ignore persistence failures
    }
  }
}

export const toggleSidebarState = () => {
  if (typeof document === "undefined") return
  const currentState =
    document.documentElement.dataset[SIDEBAR_STATE_DATASET_PROP]
  const nextState: SidebarState = currentState === "closed" ? "open" : "closed"
  writeSidebarState(nextState)
}
