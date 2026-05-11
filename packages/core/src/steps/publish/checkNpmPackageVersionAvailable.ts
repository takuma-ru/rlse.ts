import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { resolveNpmPackageVersion } from "./utils";
import { resolveOption, type Resolvable } from "../resolveOption";

export const checkNpmPackageVersionAvailable = (options: {
  packageName: Resolvable<string>;
  version: Resolvable<string>;
}): RlseStep => ({
  name: "checkNpmPackageVersionAvailable",
  run: (context) => {
    const packageName = resolveOption(options.packageName, context);
    const version = resolveOption(options.version, context);
    const publishedVersion = resolveNpmPackageVersion(
      packageName,
      version,
      context.cwd,
    );

    if (publishedVersion === version) {
      throw new Error(`${packageName}@${version} is already published`);
    }

    consola.success(`${packageName}@${version} is available for publish`);

    return {
      packageName,
      version,
      available: true,
    };
  },
});
