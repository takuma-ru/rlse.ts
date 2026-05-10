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

    const message = resolveCommitMessage(context, options?.message);

    cmdFile("git", ["commit", "-m", message], {
      successCallback: (stdout) => {
        consola.success(`Committed ${message}`);
        return stdout;
      },
    });
  },
});

const resolveCommitMessage = (
  context: Parameters<RlseStep["run"]>[0],
  message?: string | ((context: Parameters<RlseStep["run"]>[0]) => string),
) => {
  if (typeof message === "function") {
    return message(context);
  }

  if (message) {
    return message;
  }

  if (context.packageName && context.newVersion) {
    return `Release ${context.packageName} ${context.newVersion}`;
  }

  return "Release changes";
};
