/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/react" />

declare module "github-markdown-css";

declare module "*.mdx" {
  let MDXComponent: (props: Record<string, unknown>) => JSX.Element;
  export default MDXComponent;
}
