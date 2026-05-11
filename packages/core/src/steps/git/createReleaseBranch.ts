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
        cwd: context.cwd,
        stdio: "pipe",
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Base branch: ${stdout}`);
        return stdout.trim();
      },
    });

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git switch -c ${branch}`);

      return {
        baseBranch,
        branch,
        dryRun: true,
        created: false,
      };
    }

    cmdFile("git", ["switch", "-c", branch], {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Switched to ${branch}`);
        return stdout;
      },
    });

    return {
      baseBranch,
      branch,
      dryRun: false,
      created: true,
    };
  },
  rollback: (context, result) => {
    if (!isCreateReleaseBranchResult(result.value) || !result.value.created) {
      return;
    }

    cmdFile("git", ["switch", result.value.baseBranch], {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
    });
    cmdFile("git", ["branch", "-D", result.value.branch], {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
    });
  },
});

const isCreateReleaseBranchResult = (
  value: unknown,
): value is { baseBranch: string; branch: string; created: boolean } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "baseBranch" in value &&
    typeof value.baseBranch === "string" &&
    "branch" in value &&
    typeof value.branch === "string" &&
    "created" in value &&
    typeof value.created === "boolean"
  );
};
