import { Flex, Heading, Text, useDisclosure } from "@chakra-ui/react"
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
      <Flex bg="blackAlpha.100" padding={{ base: 3, lg: 5 }}>
        <MenuIconButton onOpen={onOpen} />
        <Heading _hover={{ cursor: "pointer" }}>
          <Link to="/">
            <Text fontSize="4xl" fontFamily='"Times New Roman", serif'>
              Order
            </Text>
          </Link>
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
