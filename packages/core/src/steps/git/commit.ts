import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { getStagedFiles } from "./utils";

export const commit = (options: {
  message: string;
  skipIfNoChanges?: boolean;
}): RlseStep => ({
  name: "commit",
  run: () => {
    const stagedFiles = getStagedFiles()
      .split("\n")
      .filter((file) => file.length > 0);
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
      };
    }

    cmdFile("git", ["commit", "-m", options.message], {
      successCallback: (stdout) => {
        consola.success(`Committed ${options.message}`);
        return stdout;
      },
    });

    return {
      message: options.message,
      committed: true,
      stagedFiles,
    };
  },
});
