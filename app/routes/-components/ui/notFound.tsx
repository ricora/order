import HouseIcon from "../icons/lucide/house"
import LinkButton from "./linkButton"

type NotFoundProps = {
  homeHref: string
  homeLabel: string
}

const NotFound = ({ homeHref, homeLabel }: NotFoundProps) => (
  <>
    <title>404 Not Found</title>
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
          <LinkButton href={homeHref} leftIcon={HouseIcon}>
            {homeLabel}
          </LinkButton>
        </div>
      </div>
    </div>
  </>
)

export default NotFound
