import {
    Button,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerOverlay,
  } from "@chakra-ui/react";
  import { FC, memo } from "react";
  
  type Props = {
    onClose: () => void;
    isOpen: boolean;
    onClickHome: () => void;
    onClickReception: () => void;
    onClickRegister: () => void;
    onClickKitchen: () => void;
  };
  
  export const MenueDrawer: FC<Props> = memo((props) => {
    const {
      onClose,
      isOpen,
      onClickHome,
      onClickReception,
      onClickRegister,
      onClickKitchen,
    } = props;
  
    return (
      <Drawer placement="left" size="xs" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay>
          <DrawerContent>
            <DrawerBody p={0} bg="gray.100">
              <Button w="100%" onClick={onClickHome}>
                Home
              </Button>
              <Button w="100%" onClick={onClickReception}>
                商品登録
              </Button>
              <Button w="100%" onClick={onClickRegister}>
                受付
              </Button>
              <Button w="100%" onClick={onClickKitchen}>
                厨房
              </Button>
            </DrawerBody>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    );
  });
  