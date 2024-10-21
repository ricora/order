import {
  Links,
  Outlet,
  Meta,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react"
import Header from "./routes/header"
import { ChakraProvider, Box } from "@chakra-ui/react"
import theme from "./styles/theme"
import Sidebar from "./routes/side"

export function meta() {
  return [{ title: "Order" }, { description: "Order for Jazz Club" }]
}

export default function App() {
  return (
    <html lang="ja" style={{ overflowX: "hidden" }}>
      <head>
        <meta charSet="utf-8" />
        <Links />
        <Meta />
      </head>
      <body>
        <ChakraProvider theme={theme}>
          <Box
            as="header"
            position="fixed"
            top="0"
            left="0"
            width="100%"
            zIndex="1000"
            height="80px"
          >
            <Header />
          </Box>
          <Box display="flex" minH="100vh" marginTop="80px">
            <Box
              as="nav"
              bg="gray.200"
              p={4}
              width="250px"
              position="fixed"
              top="80px"
              left="0"
              height="calc(100vh - 80px)"
              display={{ base: "none", lg: "block" }}
            >
              <Sidebar />
            </Box>
            <Box
              as="main"
              flex="1"
              ml={{ base: "none", lg: "250px" }}
              p={4}
              height="calc(100vh - 80px)"
            >
              <Outlet />
            </Box>
          </Box>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
