import { useState } from "hono/jsx"

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p className="py-2 text-2xl">{count}</p>
      <button
        type="button"
        className="cursor-pointer rounded bg-orange-400 px-4 py-2 text-white"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
    </div>
  )
}
