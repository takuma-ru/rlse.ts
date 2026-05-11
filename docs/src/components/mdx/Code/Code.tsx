import clsx from "clsx";
import type { JSX } from "hono/jsx";
import { inlineCode } from "./Code.css";

type Props = JSX.IntrinsicElements["code"];

export const Code = ({ children, ...attr }: Props) => {
  return (
    <code
      {...attr}
      className={clsx(attr.lang === "inline" && inlineCode, attr.className)}
    >
      {children}
    </code>
  );
};
