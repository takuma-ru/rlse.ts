import clsx from "clsx";
import type { JSX } from "hono/jsx";
import {
  fileNameText,
  langText,
  metaContainer,
  pre,
  preContainer,
} from "./Pre.css";
import { LangIcon } from "./utils/LangIcon";
import { cx } from "hono/css";

type Props = JSX.IntrinsicElements["pre"] & {
  lang?: string;
  "data-filename"?: string;
};

export const Pre = ({ children, className, lang, ...attr }: Props) => {
  const fileName = attr["data-filename"];

  return (
    <div className={preContainer}>
      <div className={metaContainer}>
        <span className={fileNameText}>{fileName}</span>
        <span className={langText}>
          <span>{lang}</span>
          <LangIcon lang={lang} />
        </span>
      </div>
      <pre {...attr} lang={lang} className={cx(pre, className)}>
        {/* {lang === "shell" && <span className={promptText}>$</span>} */}
        {children}
      </pre>
    </div>
  );
};
