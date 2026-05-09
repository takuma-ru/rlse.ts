import consola from "consola";
import { type ReleaseType, inc, valid } from "semver";
import { packageVersionControl } from "../action/packageVersionControl";
import type { RlseStep } from "../flow/types";
import type { ReleaseLevel, VersionResolver } from "../types/RlseConfig";
import { cmdFile } from "../utils/cmd";
import { type PackageJson, readPackageJson, writePackageJson } from "./package";

type VersionOptions = {
  level?: ReleaseLevel;
  pre?: boolean;
  version?: string | VersionResolver;
};

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

    const nextVersion = resolveNextVersion({
      currentVersion,
      packageJson: context.packageJson,
      options,
      pre,
    });

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

const resolveNextVersion = ({
  currentVersion,
  packageJson,
  options,
  pre,
}: {
  currentVersion: string;
  packageJson: PackageJson;
  options: VersionOptions;
  pre: boolean;
}) => {
  if (typeof options.version === "function") {
    return options.version({
      currentVersion,
      packageJson: { ...packageJson },
      level: options.level,
      pre,
      inc,
    });
  }

  if (options.version) {
    return options.version;
  }

  const nextVersion = inc(
    currentVersion,
    getReleaseType(options.level, pre),
    "beta",
  );
  if (!nextVersion) {
    throw new Error(`Failed to increment version from ${currentVersion}`);
  }

  return nextVersion;
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
    case "fix": {
      throw new Error("Version is required for fix level");
    }
    case undefined: {
      throw new Error(
        "Release level is required when version is not configured",
      );
    }
  }
};
