import { HamburgerIcon } from "@chakra-ui/icons"
import { IconButton } from "@chakra-ui/react"
import { FC, memo } from "react"
import PropTypes from "prop-types"

type Props = {
  onOpen: () => void
}

export const MenuIconButton: FC<Props> = memo(({ onOpen }) => {
  return (
    <IconButton
      aria-label="メニューボタン"
      icon={<HamburgerIcon />}
      size="sm"
      variant="unstyled"
      display={{ base: "block", lg: "none" }}
      onClick={onOpen}
    />
  )
})

MenuIconButton.displayName = "MenuIconButton"

MenuIconButton.propTypes = {
  onOpen: PropTypes.func.isRequired,
}
