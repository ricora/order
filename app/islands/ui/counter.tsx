import { Button } from "@/islands/ui/button"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/islands/ui/tooltip"

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p className="py-2 text-2xl">{count}</p>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button onClick={() => setCount(count + 1)}>Increment</Button>
    </div>
  )
}
