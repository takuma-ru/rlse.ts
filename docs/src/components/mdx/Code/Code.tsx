import type { JSX } from "hono/jsx";
import { inlineCode } from "./Code.css";
import { cx } from "hono/css";

type Props = JSX.IntrinsicElements["code"];

export const Code = ({ children, ...attr }: Props) => {
  return (
    <code
      {...attr}
      className={cx(attr.lang === "inline" && inlineCode, attr.className)}
    >
      {children}
    </code>
  );
};
