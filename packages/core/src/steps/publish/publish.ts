import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const publishNpmPackage = (options: {
  packageName: Resolvable<string>;
  dryRun?: boolean;
}): RlseStep => ({
  name: "publishNpmPackage",
  run: (context) => {
    const packageName = resolveOption(options.packageName, context);
    const dryRun = options.dryRun ?? context.dryRun;

    const publishArgs = ["publish", "--workspace", packageName];
    if (dryRun) {
      publishArgs.push("--dry-run");
    }

    cmdFile("npm", publishArgs, {
      successCallback: (stdout) => {
        consola.success(`Published ${packageName}`);
        return stdout;
      },
    });

    return {
      packageName,
      dryRun,
      published: !dryRun,
    };
  },
});
