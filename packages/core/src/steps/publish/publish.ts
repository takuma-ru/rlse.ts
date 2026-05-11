import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const publishNpmPackage = (options: {
  packageName: Resolvable<string>;
  packageDir?: Resolvable<string>;
  dryRun?: boolean;
}): RlseStep => ({
  name: "publishNpmPackage",
  run: (context) => {
    const packageName = resolveOption(options.packageName, context);
    const packageDir = options.packageDir
      ? resolveOption(options.packageDir, context)
      : context.cwd;
    const dryRun = options.dryRun ?? context.dryRun;

    const publishArgs = ["publish"];
    if (dryRun) {
      publishArgs.push("--dry-run");
    }

    cmdFile("npm", publishArgs, {
      execOptions: {
        cwd: packageDir,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Published ${packageName}`);
        return stdout;
      },
    });

    return {
      packageName,
      packageDir,
      dryRun,
      published: !dryRun,
    };
  },
});
