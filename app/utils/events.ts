export type EventHandler<E extends Event = Event> = (event: E) => void

export const composeEventHandlers =
  <E extends Event>(
    userHandler: EventHandler<E> | undefined,
    ours: EventHandler<E> | undefined,
  ) =>
  (event: E) => {
    userHandler?.(event)
    if (!event.defaultPrevented) {
      ours?.(event)
    }
  }

export const isEventHandler = <E extends Event = Event>(
  value: unknown,
): value is EventHandler<E> => typeof value === "function"
