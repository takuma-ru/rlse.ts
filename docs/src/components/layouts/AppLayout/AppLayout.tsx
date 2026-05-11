import type { Child } from "hono/jsx";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { main } from "./AppLayout.css";

type Props = {
  children?: Child;
};

export const AppLayout = ({ children }: Props) => {
  return (
    <div id="app">
      <Header />
      <main className={main}>{children}</main>
      <Footer />
    </div>
  );
};
