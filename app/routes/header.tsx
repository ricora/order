import { Flex, Heading, useDisclosure } from "@chakra-ui/react"
import { Link, useNavigate } from "@remix-run/react"
import { useCallback } from "react"
import { MenuIconButton } from "~/components/atoms/button/MenuIconButton"
import { MenuDrawer } from "~/components/molecules/MenuDrawer"

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  const onClickHome = useCallback(() => {
    navigate("/")
    onClose()
  }, [navigate, onClose])
  const onClickReception = useCallback(() => {
    navigate("/reception")
    onClose()
  }, [navigate, onClose])
  const onClickRegister = useCallback(() => {
    navigate("/register")
    onClose()
  }, [navigate, onClose])
  const onClickKitchen = useCallback(() => {
    navigate("/kitchen")
    onClose()
  }, [navigate, onClose])

  return (
    <>
      <Flex bg="teal.500" padding={{ base: 3, lg: 5 }}>
        <MenuIconButton onOpen={onOpen} />
        <Heading _hover={{ cursor: "pointer" }}>
          <Link to="/">Order for Jazz Club</Link>
        </Heading>
      </Flex>
      <MenuDrawer
        onClose={onClose}
        isOpen={isOpen}
        onClickHome={onClickHome}
        onClickReception={onClickReception}
        onClickRegister={onClickRegister}
        onClickKitchen={onClickKitchen}
      />
    </>
  )
}
