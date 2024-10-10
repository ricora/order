import { Box, Flex, Text, Link } from "@chakra-ui/react";
import { useLocation } from "@remix-run/react";

export default function Sidebar() {
  const location = useLocation();

  return (
    <Flex height="100vh" width="230px" bg="gray.200" direction="column" p={4}>
      <Text fontSize="xl" mb={6}>
        ページ一覧
      </Text>

      <Link
        href="/"
        mb={4}
        p={2}
        bg={location.pathname === "/" ? "blue.200" : "transparent"}
        borderRadius="md"
      >
        Home
      </Link>

      <Link
        href="/register"
        mb={4}
        p={2}
        bg={location.pathname === "/register" ? "blue.200" : "transparent"}
        borderRadius="md"
      >
        商品登録
      </Link>

      <Link
        href="/reception"
        mb={4}
        p={2}
        bg={location.pathname === "/reception" ? "blue.200" : "transparent"}
        borderRadius="md"
      >
        受付
      </Link>

      <Link
        href="/kitchen"
        mb={4}
        p={2}
        bg={location.pathname === "/kitchen" ? "blue.200" : "transparent"}
        borderRadius="md"
      >
        厨房
      </Link>
    </Flex>
  );
}
