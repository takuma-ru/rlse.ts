import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const publish = (options?: { dryRun?: boolean }): RlseStep => ({
  name: "publish",
  run: (context) => {
    if (!context.packageName || !context.newVersion) {
      throw new Error("Package and version must be resolved before publish");
    }

    const dryRun = options?.dryRun ?? context.dryRun;

    const publishArgs = [
      "publish",
      "--filter",
      context.packageName,
      "--no-git-checks",
    ];
    if (dryRun) {
      publishArgs.push("--dry-run");
    }

    cmdFile("pnpm", publishArgs, {
      successCallback: (stdout) => {
        context.published = !dryRun;
        consola.success(
          `Published ${context.packageName} ${context.newVersion}`,
        );
        return stdout;
      },
    });
  },
});
