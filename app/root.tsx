// アプリケーション全体の設定を管理
import {
  Links,
  Outlet,
  Meta,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import appStylesHref from "./styles/app.css";
import { LinksFunction } from "@remix-run/node";
import Header from "./routes/header";
import { ChakraProvider, Grid, GridItem } from "@chakra-ui/react";
import theme from "./styles/theme";
import Sidebar from "./routes/side";

// export const links: LinksFunction = () => [
//   { rel: "stylesheet", href: appStylesHref },
// ];

export function meta() {
  return [{ title: "Order" }, { description: "Order for Jazz Club" }];
}

export default function App() {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <Links />
        <Meta />
      </head>
      <body>
        <ChakraProvider theme={theme}>
          <Header />
          <Grid templateColumns={{ base: "1fr", lg: "250px 1fr" }} minH="100vh">
            <GridItem
              as="nav"
              bg="gray.200"
              display={{ base: "none", lg: "block" }} 
              p={4}
            >
              <Sidebar />
            </GridItem>
            <GridItem as="main" p={4}>
              <Outlet />
            </GridItem>
          </Grid>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
