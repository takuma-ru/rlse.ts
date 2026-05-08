import { readFileSync } from "node:fs";
import consola from "consola";
import { findPackageJsonByName } from "../action/findPackageJsonByName";
import { packageVersionControl } from "../action/packageVersionControl";
import type { RlseStep } from "../flow/types";
import type { ReleaseLevel, VersionResolver } from "../types/RlseConfig";
import { cmd, cmdFile } from "../utils/cmd";

type VersionOptions = {
  level?: ReleaseLevel;
  pre?: boolean;
  version?: string | VersionResolver;
};

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

export const resolvePackage = (options: { name: string }): RlseStep => ({
  name: "resolvePackage",
  run: async (context) => {
    const packageJsonPath = await findPackageJsonByName(options.name);

    if (!packageJsonPath) {
      throw new Error(`package.json for ${options.name} not found`);
    }

    const packageJson = JSON.parse(
      readFileSync(packageJsonPath, "utf8"),
    ) as NonNullable<typeof context.packageJson>;

    context.packageJsonPath = packageJsonPath;
    context.packageJson = packageJson;
    context.packageName = packageJson.name;
  },
});

export const bumpVersion = (options: VersionOptions = {}): RlseStep => {
  let versionReset: (() => void) | undefined;

  return {
    name: "bumpVersion",
    run: (context) => {
      if (!context.packageJsonPath) {
        throw new Error("Package must be resolved before bumpVersion");
      }

      const versionControl = packageVersionControl({
        level: options.level,
        pre: options.pre ?? false,
        version: options.version,
        packageJsonPath: context.packageJsonPath,
      });

      versionControl.versionUp();

      context.packageName = versionControl.packageName;
      context.currentVersion = versionControl.currentVersion;
      context.newVersion = versionControl.newVersion;
      versionReset = versionControl.versionReset;
    },
    rollback: () => {
      versionReset?.();
    },
  };
};

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

export const run = (command: string): RlseStep => ({
  name: "run",
  run: (context) => {
    cmd(command, {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success("Command success");
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

    const stagedFiles = cmdFile("git", ["diff", "--cached", "--name-only"], {
      execOptions: {
        stdio: "pipe",
        encoding: "utf8",
      },
      successCallback: (stdout) => stdout.trim(),
    });
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

export const publish = (options?: { dryRun?: boolean }): RlseStep => ({
  name: "publish",
  run: (context) => {
    if (!context.packageName || !context.newVersion) {
      throw new Error("Package and version must be resolved before publish");
    }

    const dryRun = options?.dryRun ?? context.dryRun;

    const publishArgs = [
      "publish",
      "--filter",
      context.packageName,
      "--no-git-checks",
    ];
    if (dryRun) {
      publishArgs.push("--dry-run");
    }

    cmdFile("pnpm", publishArgs, {
      successCallback: (stdout) => {
        consola.success(
          `Published ${context.packageName} ${context.newVersion}`,
        );
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
