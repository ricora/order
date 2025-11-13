import type { NotFoundHandler } from "hono"
import HouseIcon from "../../components/icons/lucide/house"

const handler: NotFoundHandler = (c) => {
  c.status(404)
  return c.render(
    <div class="flex min-h-full items-center justify-center bg-bg px-4">
      <div class="text-center">
        <h1 class="font-bold text-9xl text-primary">404</h1>
        <div class="mt-4 space-y-2">
          <h2 class="font-semibold text-2xl text-fg">ページが見つかりません</h2>
          <p class="text-muted-fg">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>
        <div class="mt-8">
          <a
            href="/staff"
            class="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary bg-primary px-3 py-2 font-medium text-primary-fg text-sm transition hover:bg-primary/90"
          >
            <HouseIcon />
            スタッフページに戻る
          </a>
        </div>
      </div>
    </div>,
  )
}

export default handler
