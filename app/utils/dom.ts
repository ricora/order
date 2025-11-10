const focusableSelectors = [
  "[data-drawer-autofocus]",
  'a[href]:not([tabindex="-1"])',
  'area[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'iframe:not([tabindex="-1"])',
  'audio[controls]:not([tabindex="-1"])',
  'video[controls]:not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",")

export const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.tabIndex !== -1 &&
      element.getClientRects().length > 0,
  )

let scrollLockDepth = 0
let previousOverflow = ""
let previousPaddingRight = ""
let previousTouchAction = ""

export const lockBodyScroll = () => {
  scrollLockDepth += 1
  if (scrollLockDepth > 1) return
  previousOverflow = document.body.style.overflow
  previousPaddingRight = document.body.style.paddingRight
  previousTouchAction = document.body.style.touchAction
  const scrollBarGap = window.innerWidth - document.documentElement.clientWidth
  document.body.style.overflow = "hidden"
  document.body.style.touchAction = "none"
  if (scrollBarGap > 0) {
    document.body.style.paddingRight = `${scrollBarGap}px`
  }
}

export const unlockBodyScroll = () => {
  scrollLockDepth = Math.max(0, scrollLockDepth - 1)
  if (scrollLockDepth === 0) {
    document.body.style.overflow = previousOverflow
    document.body.style.paddingRight = previousPaddingRight
    document.body.style.touchAction = previousTouchAction
  }
}
