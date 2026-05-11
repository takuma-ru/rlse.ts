import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { getStagedFiles } from "./utils";

export const commit = (options: {
  message: string;
  skipIfNoChanges?: boolean;
}): RlseStep => ({
  name: "commit",
  run: (context) => {
    const stagedFiles = getStagedFiles(context.cwd)
      .split("\n")
      .filter((file) => file.length > 0);

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git commit -m ${options.message}`);

      return {
        message: options.message,
        committed: false,
        stagedFiles,
        dryRun: true,
      };
    }

    if (!stagedFiles.length) {
      if (!options.skipIfNoChanges) {
        throw new Error("No changes to commit");
      }

      consola.info("No changes to commit");

      return {
        message: options.message,
        committed: false,
        stagedFiles,
        reason: "no_changes",
        dryRun: false,
      };
    }

    cmdFile("git", ["commit", "-m", options.message], {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Committed ${options.message}`);
        return stdout;
      },
    });

    return {
      message: options.message,
      committed: true,
      stagedFiles,
      dryRun: false,
    };
  },
});
