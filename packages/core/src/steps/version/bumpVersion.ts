import type { RlseStep } from "../../flow/types";
import { packageVersionControl } from "../../utils/packageVersionControl";
import type { VersionOptions } from "./types";

export const bumpVersion = (options: VersionOptions = {}): RlseStep => {
  let versionReset: (() => void) | undefined;

  return {
    name: "bumpVersion",
    run: (context) => {
      if (!context.packageJsonPath) {
        throw new Error("Package must be resolved before bumpVersion");
      }

      const versionControl = packageVersionControl({
        level: options.level,
        pre: options.pre ?? false,
        version: options.version,
        packageJsonPath: context.packageJsonPath,
      });

      versionControl.versionUp();

      context.packageName = versionControl.packageName;
      context.currentVersion = versionControl.currentVersion;
      context.newVersion = versionControl.newVersion;
      versionReset = versionControl.versionReset;
    },
    rollback: () => {
      versionReset?.();
    },
  };
};
