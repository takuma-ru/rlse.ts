import { config } from "../../../config";
import { GithubIcon, NpmIcon } from "../../Icon";
import { header, links, titleAnchor, titleText } from "./Header.css";

export const Header = () => {
  return (
    <header className={header}>
      <a className={titleAnchor} href="/">
        <h3 className={titleText}>{config.packageName}</h3>
      </a>
      <div className={links}>
        <a
          href="https://github.com/takuma-ru/rlse"
          target="_blank"
          rel="noreferrer"
        >
          <GithubIcon />
        </a>
        <a
          href="https://www.npmjs.com/package/rlse.ts"
          target="_blank"
          rel="noreferrer"
        >
          <NpmIcon />
        </a>
      </div>
    </header>
  );
};
