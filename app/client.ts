import { createClient } from "honox/client"

createClient({
  hydrate: async (elem, root) => {
    const { hydrateRoot } = await import("react-dom/client")
    // @ts-expect-error
    hydrateRoot(root, elem)
  },
  // @ts-expect-error
  createElement: async (type, props) => {
    const { createElement } = await import("react")
    return createElement(type, props)
  },
})
