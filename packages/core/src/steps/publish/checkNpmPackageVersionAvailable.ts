import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const checkNpmPackageVersionAvailable = (options: {
  packageName: Resolvable<string>;
  version: Resolvable<string>;
}): RlseStep => ({
  name: "checkNpmPackageVersionAvailable",
  run: (context) => {
    const packageName = resolveOption(options.packageName, context);
    const version = resolveOption(options.version, context);
    const publishedVersion = cmdFile(
      "npm",
      ["view", `${packageName}@${version}`, "version"],
      {
        execOptions: {
          cwd: context.cwd,
          stdio: "pipe",
          encoding: "utf8",
        },
        successCallback: (stdout) => stdout.trim(),
        errorCallback: () => "",
      },
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
