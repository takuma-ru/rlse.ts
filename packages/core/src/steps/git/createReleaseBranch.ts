import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const createReleaseBranch = (options: {
  branch: Resolvable<string>;
}): RlseStep => ({
  name: "createReleaseBranch",
  run: (context) => {
    const branch = resolveOption(options.branch, context);
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

    cmdFile("git", ["switch", "-c", branch], {
      successCallback: (stdout) => {
        consola.success(`Switched to ${branch}`);
        return stdout;
      },
    });

    return {
      baseBranch,
      branch,
    };
  },
  rollback: (_, result) => {
    if (!isCreateReleaseBranchResult(result.value)) {
      return;
    }

    cmdFile("git", ["switch", result.value.baseBranch]);
    cmdFile("git", ["branch", "-D", result.value.branch]);
  },
});

const isCreateReleaseBranchResult = (
  value: unknown,
): value is { baseBranch: string; branch: string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "baseBranch" in value &&
    typeof value.baseBranch === "string" &&
    "branch" in value &&
    typeof value.branch === "string"
  );
};
