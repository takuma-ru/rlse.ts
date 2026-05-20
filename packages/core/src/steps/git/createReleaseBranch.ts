import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";
import type { GitArtifactIfExists } from "./releaseArtifacts";

export const createReleaseBranch = (options: {
  branch: Resolvable<string>;
  ifExists?: Resolvable<GitArtifactIfExists>;
}): RlseStep => ({
  name: "createReleaseBranch",
  run: (context) => {
    const branch = resolveOption(options.branch, context);
    const ifExists = options.ifExists
      ? resolveOption(options.ifExists, context)
      : "fail";
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
    const exists = localBranchExists(branch, context.cwd);

    if (exists && ifExists === "skip") {
      consola.info(`Branch ${branch} already exists; switching to it`);

      if (!context.dryRun) {
        cmdFile("git", ["switch", branch], {
          execOptions: {
            cwd: context.cwd,
            encoding: "utf8",
          },
        });
      }

      return {
        baseBranch,
        branch,
        dryRun: context.dryRun,
        created: false,
        skipped: true,
      };
    }

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git switch -c ${branch}`);

      return {
        baseBranch,
        branch,
        dryRun: true,
        created: false,
        skipped: false,
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
      skipped: false,
    };
  },
  rollback: (context, result) => {
    if (!isCreateReleaseBranchResult(result.value) || result.value.dryRun) {
      return;
    }

    if (result.value.created || result.value.skipped) {
      cmdFile("git", ["switch", result.value.baseBranch], {
        execOptions: {
          cwd: context.cwd,
          encoding: "utf8",
        },
      });
    }

    if (result.value.created) {
      cmdFile("git", ["branch", "-D", result.value.branch], {
        execOptions: {
          cwd: context.cwd,
          encoding: "utf8",
        },
      });
    }
  },
});

const isCreateReleaseBranchResult = (
  value: unknown,
): value is {
  baseBranch: string;
  branch: string;
  dryRun: boolean;
  created: boolean;
  skipped: boolean;
} => {
  return (
    typeof value === "object" &&
    value !== null &&
    "baseBranch" in value &&
    typeof value.baseBranch === "string" &&
    "branch" in value &&
    typeof value.branch === "string" &&
    "dryRun" in value &&
    typeof value.dryRun === "boolean" &&
    "created" in value &&
    typeof value.created === "boolean" &&
    "skipped" in value &&
    typeof value.skipped === "boolean"
  );
};

const localBranchExists = (branch: string, cwd: string) => {
  return Boolean(
    cmdFile("git", ["rev-parse", "--verify", `refs/heads/${branch}`], {
      execOptions: {
        cwd,
        stdio: "pipe",
        encoding: "utf8",
      },
      errorCallback: () => "",
      silentError: true,
    }),
  );
};
