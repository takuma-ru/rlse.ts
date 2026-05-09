import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { getStagedFiles } from "./utils";

export const commit = (options?: {
  message?: string | ((context: Parameters<RlseStep["run"]>[0]) => string);
}): RlseStep => ({
  name: "commit",
  run: (context) => {
    const stagedFiles = getStagedFiles();
    if (!stagedFiles) {
      consola.info("No changes to commit");
      return;
    }

    const message =
      typeof options?.message === "function"
        ? options.message(context)
        : (options?.message ??
          `Release ${context.packageName} ${context.newVersion}`);

    cmdFile("git", ["commit", "-m", message], {
      successCallback: (stdout) => {
        consola.success(
          `Committed ${context.packageName} ${context.newVersion}`,
        );
        return stdout;
      },
    });
  },
});
