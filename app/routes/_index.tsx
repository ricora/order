import { Box, HStack, VStack } from "@chakra-ui/react";

export default function Home() {
  return (
    <div>
      <HStack>
        <Box w="450px" h="500px" bg="white">
          <Box fontSize="xl">総売り上げ</Box>
          <VStack>
            <Box fontSize="xl">
              5000円
            </Box>
          </VStack>
        </Box>
      </HStack>
    </div>
  );
}
