import {
  createContext,
  type JSX,
  type MouseEvent,
  type PropsWithChildren,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "hono/jsx"
import { tv } from "tailwind-variants"
import type { EventHandler } from "../../utils/events"

// Internal hooks
const MEDIA_QUERY = "(prefers-reduced-motion: reduce)"

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mediaQuery = window.matchMedia(MEDIA_QUERY)
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches)

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return prefersReducedMotion
}

const usePresence = (open: boolean, duration: number) => {
  const [shouldRender, setShouldRender] = useState(open)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      return
    }
    if (duration === 0) {
      setShouldRender(false)
      return
    }
    const timer = window.setTimeout(() => setShouldRender(false), duration)
    return () => window.clearTimeout(timer)
  }, [open, duration])

  return shouldRender
}

// Internal utility functions
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

const getFocusableElements = (container: HTMLElement) =>
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

const lockBodyScroll = () => {
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

const unlockBodyScroll = () => {
  scrollLockDepth = Math.max(0, scrollLockDepth - 1)
  if (scrollLockDepth === 0) {
    document.body.style.overflow = previousOverflow
    document.body.style.paddingRight = previousPaddingRight
    document.body.style.touchAction = previousTouchAction
  }
}

type DrawerSide = "top" | "right" | "bottom" | "left"
type SetOpenAction = boolean | ((prev: boolean) => boolean)

type ElementProps<T extends keyof JSX.IntrinsicElements> = Omit<
  JSX.IntrinsicElements[T],
  "ref" | "children"
>

type DrawerRootProps = PropsWithChildren<{
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  dismissible?: boolean
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  lockScroll?: boolean
  side?: DrawerSide
}>

type DrawerTriggerProps = PropsWithChildren<
  Omit<ElementProps<"button">, "onClick"> & {
    onClick?: EventHandler
  }
>

type DrawerOverlayProps = PropsWithChildren<ElementProps<"div">>

type DrawerContentProps = PropsWithChildren<
  ElementProps<"div"> & {
    side?: DrawerSide
  }
>

type DrawerCloseProps = PropsWithChildren<
  Omit<ElementProps<"button">, "onClick"> & {
    onClick?: EventHandler
  }
>

type DrawerContextValue = {
  open: boolean
  setOpen: (next: SetOpenAction) => void
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  dismissible: boolean
  closeOnOverlayClick: boolean
  closeOnEsc: boolean
  animationDuration: number
  side: DrawerSide
  triggerRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  registerContent: (id: string | null) => void
  contentId?: string
}

const DrawerContext = createContext<DrawerContextValue | null>(null)

const drawerStyles = tv({
  slots: {
    overlay:
      "fixed inset-0 z-40 bg-overlay/30 backdrop-blur-xs transition-opacity duration-300 ease-out data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
    content:
      "fixed z-50 flex max-h-screen w-fit flex-col border border-border bg-overlay text-overlay-fg shadow-2xl outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-primary/60 data-[state=closed]:pointer-events-none",
  },
  variants: {
    side: {
      bottom: {
        content:
          "right-0 bottom-0 left-0 rounded-t-4xl border-t bg-overlay data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
      },
      top: {
        content:
          "data-[state=closed]:-translate-y-full top-0 right-0 left-0 rounded-b-4xl border-b data-[state=open]:translate-y-0",
      },
      right: {
        content:
          "top-0 right-0 h-full border-l data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
      },
      left: {
        content:
          "data-[state=closed]:-translate-x-full top-0 left-0 h-full border-r data-[state=open]:translate-x-0",
      },
    },
  },
  defaultVariants: {
    side: "bottom",
  },
})

const TRANSITION_MS = 280

const useDrawerContext = (component: string) => {
  const context = useContext(DrawerContext)
  if (!context) {
    throw new Error(`${component} must be used within <Drawer.Root>`)
  }
  return context
}

const DrawerRoot = ({
  open,
  defaultOpen = false,
  onOpenChange,
  dismissible = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  lockScroll = true,
  side = "bottom",
  children,
}: DrawerRootProps) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = typeof open === "boolean"
  const currentOpen = isControlled ? Boolean(open) : uncontrolledOpen
  const animationDuration = prefersReducedMotion ? 0 : TRANSITION_MS
  const triggerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)
  const hadMountedOpenRef = useRef(currentOpen)
  const [contentId, setContentId] = useState<string>()

  const setOpenValue = useCallback(
    (next: SetOpenAction) => {
      const resolveValue = (prev: boolean) =>
        typeof next === "function" ? next(prev) : next

      if (!isControlled) {
        setUncontrolledOpen((prev) => {
          const resolved = resolveValue(prev)
          if (resolved !== prev) {
            onOpenChange?.(resolved)
          }
          return resolved
        })
      } else {
        const resolved = resolveValue(currentOpen)
        if (resolved !== currentOpen) {
          onOpenChange?.(resolved)
        }
      }
    },
    [currentOpen, isControlled, onOpenChange],
  )

  const openDrawer = useCallback(() => setOpenValue(true), [setOpenValue])
  const closeDrawer = useCallback(() => setOpenValue(false), [setOpenValue])
  const toggleDrawer = useCallback(
    () => setOpenValue((prev) => !prev),
    [setOpenValue],
  )

  useEffect(() => {
    if (!currentOpen) {
      if (hadMountedOpenRef.current) {
        const focusTarget = triggerRef.current ?? lastFocusedElementRef.current
        focusTarget?.focus({ preventScroll: true })
      }
      hadMountedOpenRef.current = false
      return
    }
    hadMountedOpenRef.current = true
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) {
      lastFocusedElementRef.current = activeElement
    }
    const content = contentRef.current
    if (!content) return
    const raf = window.requestAnimationFrame(() => {
      const focusTarget =
        content.querySelector<HTMLElement>("[data-drawer-autofocus]") ??
        getFocusableElements(content)[0] ??
        content
      focusTarget?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(raf)
  }, [currentOpen])

  useEffect(() => {
    if (!currentOpen) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible && closeOnEsc) {
        event.preventDefault()
        closeDrawer()
        return
      }
      if (event.key !== "Tab") return
      const content = contentRef.current
      if (!content) return
      const focusable = getFocusableElements(content)
      if (focusable.length === 0) {
        event.preventDefault()
        content.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      const activeElement = document.activeElement
      if (event.shiftKey) {
        if (activeElement === first || !content.contains(activeElement)) {
          event.preventDefault()
          last.focus()
        }
        return
      }
      if (activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [currentOpen, dismissible, closeOnEsc, closeDrawer])

  useEffect(() => {
    if (!lockScroll || !currentOpen) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [currentOpen, lockScroll])

  const registerContent = useCallback(
    (id: string | null) => setContentId(id ?? undefined),
    [],
  )

  const contextValue = useMemo<DrawerContextValue>(
    () => ({
      open: currentOpen,
      setOpen: setOpenValue,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      dismissible,
      closeOnOverlayClick,
      closeOnEsc,
      animationDuration,
      side,
      triggerRef,
      contentRef,
      registerContent,
      contentId,
    }),
    [
      animationDuration,
      closeDrawer,
      closeOnEsc,
      closeOnOverlayClick,
      contentId,
      currentOpen,
      dismissible,
      openDrawer,
      registerContent,
      setOpenValue,
      side,
      toggleDrawer,
    ],
  )

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
    </DrawerContext.Provider>
  )
}

const DrawerTrigger = ({
  onClick,
  children,
  type = "button",
  disabled,
  ...rest
}: DrawerTriggerProps) => {
  const { open, openDrawer, triggerRef, contentId } =
    useDrawerContext("Drawer.Trigger")

  const handleClick = (event: Event) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled) return
    openDrawer()
  }

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-haspopup="dialog"
      aria-controls={contentId}
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      onClick={handleClick}
      ref={(node: HTMLButtonElement | null) => {
        triggerRef.current = node
      }}
    >
      {children}
    </button>
  )
}

const DrawerOverlay = ({
  children,
  className,
  onClick,
  style,
  ...rest
}: DrawerOverlayProps) => {
  const {
    open,
    closeDrawer,
    dismissible,
    closeOnOverlayClick,
    animationDuration,
  } = useDrawerContext("Drawer.Overlay")
  const shouldRender = usePresence(open, animationDuration)

  if (!shouldRender) return null

  const handleClick = (event: MouseEvent) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (!dismissible || !closeOnOverlayClick) return
    if (event.currentTarget !== event.target) return
    closeDrawer()
  }

  const { overlay } = drawerStyles()
  return (
    <div
      {...rest}
      aria-hidden="true"
      data-state={open ? "open" : "closed"}
      className={overlay({ class: className })}
      onClick={handleClick}
      style={{
        ...style,
        transitionDuration: `${animationDuration}ms`,
      }}
    >
      {children}
    </div>
  )
}

const DrawerContent = ({
  side: sideProp,
  className,
  children,
  id,
  style,
  ...rest
}: DrawerContentProps) => {
  const roleProp = rest.role
  const ariaModalProp = rest["aria-modal" as keyof typeof rest] as
    | JSX.IntrinsicElements["div"]["aria-modal"]
    | undefined
  const resolvedRole = roleProp ?? "dialog"
  const resolvedAriaModal =
    resolvedRole === "dialog" ? (ariaModalProp ?? true) : ariaModalProp
  const ariaModalProps =
    resolvedRole === "dialog" && resolvedAriaModal !== undefined
      ? { "aria-modal": resolvedAriaModal }
      : undefined
  const {
    open,
    side: rootSide,
    contentRef,
    registerContent,
    animationDuration,
  } = useDrawerContext("Drawer.Content")
  const side = sideProp ?? rootSide
  const { content } = drawerStyles({ side })
  const generatedId = useId()
  const resolvedId = id ?? `drawer-${generatedId}`

  useEffect(() => {
    registerContent(resolvedId)
    return () => registerContent(null)
  }, [registerContent, resolvedId])

  return (
    <div
      {...rest}
      {...ariaModalProps}
      id={resolvedId}
      role={resolvedRole}
      data-side={side}
      data-state={open ? "open" : "closed"}
      tabIndex={-1}
      className={content({ class: className })}
      ref={contentRef}
      style={{
        ...style,
        transitionDuration: `${animationDuration}ms`,
      }}
    >
      {children}
    </div>
  )
}

const DrawerClose = ({
  children,
  type = "button",
  onClick,
  ...rest
}: DrawerCloseProps) => {
  const { closeDrawer } = useDrawerContext("Drawer.Close")

  const handleClick = (event: Event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    closeDrawer()
  }

  return (
    <button type={type} {...rest} onClick={handleClick}>
      {children}
    </button>
  )
}

export { DrawerClose, DrawerContent, DrawerOverlay, DrawerRoot, DrawerTrigger }
