import HouseIcon from "../icons/lucide/house"

type NotFoundProps = {
  homeHref: string
  homeLabel: string
}

const NotFound = ({ homeHref, homeLabel }: NotFoundProps) => (
  <div class="flex min-h-screen items-center justify-center bg-bg px-4">
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
          href={homeHref}
          class="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded border border-primary bg-primary px-3 py-2 font-medium text-primary-fg text-sm transition hover:bg-primary/90"
        >
          <HouseIcon />
          {homeLabel}
        </a>
      </div>
    </div>
  </div>
)

export default NotFound
