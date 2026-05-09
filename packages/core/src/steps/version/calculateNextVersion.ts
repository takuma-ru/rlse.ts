import { valid } from "semver";
import type { RlseStep } from "../../flow/types";
import { resolveNextVersion } from "./utils";
import type { VersionOptions } from "./types";

export const calculateNextVersion = (
  options: VersionOptions = {},
): RlseStep => ({
  name: "calculateNextVersion",
  run: (context) => {
    if (!context.packageJson) {
      throw new Error("Package must be resolved before calculateNextVersion");
    }

    const currentVersion =
      context.currentVersion ?? context.packageJson.version ?? "0.0.0";
    const pre = options.pre ?? false;

    const nextVersion = resolveNextVersion({
      currentVersion,
      packageJson: context.packageJson,
      options,
      pre,
    });

    if (!nextVersion || !valid(nextVersion)) {
      throw new Error(`Invalid version: ${nextVersion}`);
    }

    context.currentVersion = currentVersion;
    context.newVersion = nextVersion;
  },
});
