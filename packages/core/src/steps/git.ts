import consola from "consola";
import type { RlseStep } from "../flow/types";
import { cmdFile } from "../utils/cmd";

export const configureGit = (options?: {
  name?: string;
  email?: string;
}): RlseStep => ({
  name: "configureGit",
  run: () => {
    if (options?.name) {
      cmdFile("git", ["config", "--local", "user.name", options.name]);
    }
    if (options?.email) {
      cmdFile("git", ["config", "--local", "user.email", options.email]);
    }
  },
});

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

export const stageFiles = (options?: { paths?: string[] }): RlseStep => ({
  name: "stageFiles",
  run: (context) => {
    const paths =
      options?.paths ??
      (context.packageJsonPath ? [context.packageJsonPath] : undefined);

    if (!paths?.length) {
      throw new Error("Files must be provided before stageFiles");
    }

    cmdFile("git", ["add", ...paths], {
      successCallback: (stdout) => {
        consola.success(`Added ${paths.join(", ")}`);
        return stdout;
      },
    });
  },
});

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

export const push = (options?: {
  branch?: string | ((context: Parameters<RlseStep["run"]>[0]) => string);
  setUpstream?: boolean;
}): RlseStep => ({
  name: "push",
  run: (context) => {
    const targetBranch =
      typeof options?.branch === "function"
        ? options.branch(context)
        : (options?.branch ??
          context.releaseBranch ??
          context.baseBranch ??
          getCurrentBranch());
    const args = options?.setUpstream
      ? ["push", "--set-upstream", "origin", targetBranch]
      : ["push", "origin", targetBranch];

    cmdFile("git", args, {
      successCallback: (stdout) => {
        consola.success(`Pushed to ${targetBranch}`);
        return stdout;
      },
    });
  },
});

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

const getCurrentBranch = () => {
  return cmdFile("git", ["branch", "--show-current"], {
    execOptions: {
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => stdout.trim(),
  });
};

const getStagedFiles = () => {
  return cmdFile("git", ["diff", "--cached", "--name-only"], {
    execOptions: {
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => stdout.trim(),
  });
};
