import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const verifyPublishedNpmPackage = (options: {
  packageName: Resolvable<string>;
  version: Resolvable<string>;
}): RlseStep => ({
  name: "verifyPublishedNpmPackage",
  run: (context) => {
    const packageName = resolveOption(options.packageName, context);
    const version = resolveOption(options.version, context);

    if (context.dryRun) {
      consola.info(`[dry-run] Skip verifying ${packageName}@${version}`);

      return {
        packageName,
        version,
        dryRun: true,
        verified: false,
      };
    }

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
      },
    );

    if (publishedVersion !== version) {
      throw new Error(
        `Expected ${packageName}@${version}, but registry returned ${publishedVersion}`,
      );
    }

    consola.success(`Verified ${packageName}@${version} on npm`);

    return {
      packageName,
      version,
      dryRun: false,
      verified: true,
    };
  },
});
