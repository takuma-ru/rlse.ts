import type { JSX } from "hono/jsx";
import { OpenInNewIcon } from "../../Icon";
import { anchor } from "./Anchor.css";

type Props = JSX.IntrinsicElements["a"];

export const Anchor = ({ children, ...props }: Props) => {
  const { href } = props;

  const isExternal = href?.startsWith("http") ?? false;

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : props.target}
      className={anchor}
      {...props}
    >
      {children}
      {isExternal && <OpenInNewIcon />}
    </a>
  );
};
