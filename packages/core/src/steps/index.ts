import { readFileSync, writeFileSync } from "node:fs";
import consola from "consola";
import { type ReleaseType, inc, valid } from "semver";
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

type PackageJson = Record<string, unknown> & {
  name?: string;
  version?: string;
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

    const packageJson = readPackageJson(packageJsonPath);

    context.packageJsonPath = packageJsonPath;
    context.packageJson = packageJson;
    context.packageName = packageJson.name;
  },
});

export const resolvePublishedVersion = (): RlseStep => ({
  name: "resolvePublishedVersion",
  run: (context) => {
    if (!context.packageJsonPath || !context.packageName) {
      throw new Error(
        "Package must be resolved before resolvePublishedVersion",
      );
    }

    context.currentVersion = cmdFile(
      "npm",
      ["show", context.packageName, "version"],
      {
        execOptions: {
          stdio: "pipe",
          encoding: "utf8",
        },
        successCallback: (stdout) => stdout.trim(),
        errorCallback: (error) => {
          consola.error(error.message);
          return context.packageJson?.version ?? "0.0.0";
        },
      },
    );

    consola.info(`Current version: ${context.currentVersion}`);
  },
});

export const calculateNextVersion = (
  options: VersionOptions = {},
): RlseStep => ({
  name: "calculateNextVersion",
  run: (context) => {
    if (!context.packageJson) {
      throw new Error("Package must be resolved before calculateNextVersion");
    }

    const currentVersion =
      context.currentVersion ?? context.packageJson.version ?? "0.0.0";
    const pre = options.pre ?? false;

    const nextVersion =
      typeof options.version === "function"
        ? options.version({
            currentVersion,
            packageJson: { ...context.packageJson },
            level: options.level,
            pre,
            inc,
          })
        : (options.version ??
          inc(currentVersion, getReleaseType(options.level, pre), "beta"));

    if (!nextVersion || !valid(nextVersion)) {
      throw new Error(`Invalid version: ${nextVersion}`);
    }

    context.currentVersion = currentVersion;
    context.newVersion = nextVersion;
  },
});

export const writePackageVersion = (): RlseStep => ({
  name: "writePackageVersion",
  run: (context) => {
    if (!context.packageJsonPath || !context.newVersion) {
      throw new Error(
        "Next version must be calculated before writePackageVersion",
      );
    }

    const packageJson = readPackageJson(context.packageJsonPath);
    const previousVersion = packageJson.version;

    packageJson.version = context.newVersion;
    writePackageJson(context.packageJsonPath, packageJson);

    context.packageJson = readPackageJson(context.packageJsonPath);
    context.versionReset = () => {
      const currentPackageJson = readPackageJson(context.packageJsonPath!);
      currentPackageJson.version = previousVersion;
      writePackageJson(context.packageJsonPath!, currentPackageJson);
      context.packageJson = readPackageJson(context.packageJsonPath!);
      consola.info(`Reset version: ${previousVersion}`);
    };

    consola.info(`New version: ${context.packageJson.version}`);
  },
  rollback: (context) => {
    context.versionReset?.();
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

const getStagedFiles = () => {
  return cmdFile("git", ["diff", "--cached", "--name-only"], {
    execOptions: {
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => stdout.trim(),
  });
};

const readPackageJson = (packageJsonPath: string) => {
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
};

const writePackageJson = (
  packageJsonPath: string,
  packageJson: PackageJson,
) => {
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

const getReleaseType = (level?: ReleaseLevel, pre = false): ReleaseType => {
  switch (level) {
    case "patch": {
      if (pre) return "prepatch";
      return "patch";
    }
    case "minor": {
      if (pre) return "preminor";
      return "minor";
    }
    case "major": {
      if (pre) return "premajor";
      return "major";
    }
    case "preup": {
      return "prerelease";
    }
    case "fix":
    case undefined: {
      throw new Error(
        "Release level is required when version is not configured",
      );
    }
  }
};
