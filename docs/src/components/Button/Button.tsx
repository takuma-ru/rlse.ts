import clsx from "clsx";
import type { Child } from "hono/jsx";
import type { JSX } from "hono/jsx";
import { anchor, button } from "./Button.css";

type Props = { children?: Child } & (AnchorProps | ButtonProps);
type AnchorProps = { tagType: "a" } & JSX.IntrinsicElements["a"];
type ButtonProps = {
  tagType: "button";
} & JSX.IntrinsicElements["button"];

export const Button = (props: Props) => {
  switch (props.tagType) {
    case "a": {
      const { children, ...attr } = props;

      return (
        <a {...attr} className={clsx(anchor, attr.className)}>
          {children}
        </a>
      );
    }
    case "button": {
      const { children, ...attr } = props;

      return (
        <button {...attr} className={clsx(button, attr.className)}>
          {children}
        </button>
      );
    }
  }
};
