import { useEffect, useState } from "hono/jsx"

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

export default usePresence
