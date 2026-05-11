import { valid } from "semver";
import type { RlseStep } from "../../flow/types";
import { resolveNextVersion } from "./utils";
import type { VersionOptions } from "./types";
import { resolveOption } from "../resolveOption";

export const calculateNextSemver = (options: VersionOptions): RlseStep => ({
  name: "calculateNextSemver",
  run: (context) => {
    const currentVersion = resolveOption(options.currentVersion, context);
    const packageJson = options.packageJson
      ? resolveOption(options.packageJson, context)
      : undefined;
    const pre = options.pre ?? false;

    const nextVersion = resolveNextVersion({
      currentVersion,
      packageJson,
      options,
      pre,
    });

    if (!nextVersion || !valid(nextVersion)) {
      throw new Error(`Invalid version: ${nextVersion}`);
    }

    return {
      currentVersion,
      nextVersion,
      level: options.level,
      pre,
    };
  },
});
