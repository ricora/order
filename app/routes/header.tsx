import { Flex, Heading, useDisclosure } from "@chakra-ui/react";
import { Link, useNavigate } from "@remix-run/react";
import { useCallback } from "react";
import { MenuIconButton } from "~/components/atoms/button/MenuIconButton";
import { MenueDrawer } from "~/components/molecules/MenueDrawer";

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const onClickHome = useCallback(() => {
    navigate("/");
    onClose();
  }, []);
  const onClickReception = useCallback(() => {
    navigate("/reception");
    onClose();
  }, []);
  const onClickRegister = useCallback(() => {
    navigate("/register");
    onClose();
  }, []);
  const onClickKitchen = useCallback(() => {
    navigate("/kitchen");
    onClose();
  }, []);

  return (
    <>
      <Flex bg="teal.500" padding={{ base: 3, md: 5 }}>
      <MenuIconButton onOpen={onOpen} />
        <Heading _hover={{ cursor: "pointer" }}>
          <Link to="/">Order for Jazz Club</Link>
        </Heading>
      </Flex>
      <MenueDrawer
        onClose={onClose}
        isOpen={isOpen}
        onClickHome={onClickHome}
        onClickReception={onClickReception}
        onClickRegister={onClickRegister}
        onClickKitchen={onClickKitchen}
      />
    </>
  );
}
