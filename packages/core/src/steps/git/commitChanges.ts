import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { getCurrentBranch, getStagedFiles } from "./utils";

export const commitChanges = (options?: {
  message?: string | ((context: Parameters<RlseStep["run"]>[0]) => string);
}): RlseStep => ({
  name: "commitChanges",
  run: (context) => {
    if (
      !context.packageJsonPath ||
      !context.packageName ||
      !context.newVersion
    ) {
      throw new Error(
        "Package and version must be resolved before commitChanges",
      );
    }

    const message =
      typeof options?.message === "function"
        ? options.message(context)
        : (options?.message ??
          `Release ${context.packageName} ${context.newVersion}`);
    const targetBranch =
      context.releaseBranch ?? context.baseBranch ?? getCurrentBranch();

    cmdFile("git", ["add", context.packageJsonPath], {
      successCallback: (stdout) => {
        consola.success(`Added ${context.packageJsonPath}`);
        return stdout;
      },
    });

    const stagedFiles = getStagedFiles();
    if (!stagedFiles) {
      consola.info("No changes to commit");
      return;
    }

    cmdFile("git", ["commit", "-m", message], {
      successCallback: (stdout) => {
        context.committed = true;
        consola.success(
          `Committed ${context.packageName} ${context.newVersion}`,
        );
        return stdout;
      },
    });
    cmdFile("git", ["push", "origin", targetBranch], {
      successCallback: (stdout) => {
        consola.success(`Pushed ${context.packageName} ${context.newVersion}`);
        return stdout;
      },
    });
  },
});
