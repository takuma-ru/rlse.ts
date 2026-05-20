import type { RlseContext } from "../../flow/types";
import { resolveOption, type Resolvable } from "../resolveOption";

export type GitArtifactIfExists = "fail" | "skip";

export const env = (
  names: string | string[],
  options?: {
    fallback?: string;
    separator?: string;
  },
) => {
  const values = (Array.isArray(names) ? names : [names])
    .map((name) => process.env[name])
    .filter((value): value is string => Boolean(value));

  if (!values.length) {
    return options?.fallback;
  }

  return values.join(options?.separator ?? "-");
};

export const releaseBranchName = (options: {
  version: Resolvable<string>;
  prefix?: Resolvable<string>;
  suffix?: Resolvable<string | false | undefined>;
  separator?: Resolvable<string>;
}) => {
  return (context: RlseContext) => {
    const prefix =
      options.prefix !== undefined
        ? resolveOption(options.prefix, context)
        : "release";
    const version = resolveOption(options.version, context);
    const suffix =
      options.suffix !== undefined
        ? resolveOption(options.suffix, context)
        : undefined;
    const separator =
      options.separator !== undefined
        ? resolveOption(options.separator, context)
        : "/";
    const name = `${prefix}${separator}${version}`;

    if (suffix === false || suffix === undefined) {
      return name;
    }

    return `${name}-${suffix}`;
  };
};
