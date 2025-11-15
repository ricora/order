import {
  DEFAULT_SIDEBAR_STATE,
  readSidebarStateFromStorage,
  SIDEBAR_STATE_DATASET_PROP,
} from "./sidebar"

try {
  const root = document.documentElement
  const stored = readSidebarStateFromStorage()
  root.dataset[SIDEBAR_STATE_DATASET_PROP] = stored
} catch {
  document.documentElement.dataset[SIDEBAR_STATE_DATASET_PROP] ??=
    DEFAULT_SIDEBAR_STATE
}
