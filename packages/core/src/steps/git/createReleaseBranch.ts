import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const createReleaseBranch = (options?: {
  name?: string | ((context: Parameters<RlseStep["run"]>[0]) => string);
}): RlseStep => ({
  name: "createReleaseBranch",
  run: (context) => {
    const baseBranch = cmdFile("git", ["branch", "--show-current"], {
      execOptions: {
        stdio: "pipe",
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Base branch: ${stdout}`);
        return stdout.trim();
      },
    });
    const releaseBranch =
      typeof options?.name === "function"
        ? options.name(context)
        : (options?.name ??
          `release/${new Date().toISOString().replace(/[-:.]/g, "_")}`);

    context.baseBranch = baseBranch;
    context.releaseBranch = releaseBranch;

    cmdFile("git", ["switch", "-c", releaseBranch], {
      successCallback: (stdout) => {
        consola.success(`Switched to ${releaseBranch}`);
        return stdout;
      },
    });
    cmdFile("git", ["push", "--set-upstream", "origin", releaseBranch], {
      successCallback: (stdout) => {
        consola.success(`Pushed to ${releaseBranch}`);
        return stdout;
      },
    });
  },
  rollback: (context) => {
    if (!context.baseBranch || !context.releaseBranch) {
      return;
    }

    cmdFile("git", ["switch", context.baseBranch]);
    cmdFile("git", ["branch", "-D", context.releaseBranch]);
    cmdFile("git", ["push", "origin", "--delete", context.releaseBranch]);
  },
});
