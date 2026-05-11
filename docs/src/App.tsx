import type { MDXComponents } from "mdx/types";
import AppMd from "./App.mdx";
import { AppLayout } from "./components/layouts/AppLayout/AppLayout";
import { Anchor } from "./components/mdx/Anchor/Anchor";
import { Code } from "./components/mdx/Code/Code";
import { Pre } from "./components/mdx/Pre/Pre";

const components: MDXComponents = {
  code: Code,
  pre: Pre,
  a: Anchor,
};

function App() {
  return (
    <AppLayout>
      <AppMd components={components} />
    </AppLayout>
  );
}

export default App;
