import type { Child } from "hono/jsx";
import { CodeJsonIcon, CommandLineIcon, TypescriptIcon } from "../../../Icon";

const langIcon = {
  shell: <CommandLineIcon />,
  json: <CodeJsonIcon />,
  typescript: <TypescriptIcon />,
  ts: <TypescriptIcon />,
} as const satisfies Record<string, Child>;

export const LangIcon = ({ lang }: { lang: string | undefined }) => {
  if (!lang) {
    return null;
  }

  if (lang in langIcon) {
    return langIcon[lang as keyof typeof langIcon];
  }

  return null;
};
