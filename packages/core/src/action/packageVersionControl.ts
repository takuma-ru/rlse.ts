import { readFileSync, writeFileSync } from "node:fs";
import consola from "consola";
import { type ReleaseType, inc, valid } from "semver";
import type { ReleaseLevel, VersionResolver } from "../types/RlseConfig";
import { cmd } from "../utils/cmd";

type PackageVersionControlOptions = {
  level?: ReleaseLevel;
  pre: boolean;
  version?: string | VersionResolver;
  packageJsonPath: string;
};

export const packageVersionControl = ({
  level,
  pre,
  version,
  packageJsonPath,
}: PackageVersionControlOptions) => {
  let packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<
    string,
    unknown
  > & {
    name?: string;
    version?: string;
  };

  const currentVersion = cmd(`npm show ${packageJson.name} version`, {
    execOptions: {
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => {
      return stdout.trim();
    },
    errorCallback: (error) => {
      consola.error(error.message);
      return packageJson.version;
    },
  });

  consola.info(`Current version: ${currentVersion}`);

  const getReleaseType = (): ReleaseType => {
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
      default: {
        return "patch";
      }
    }
  };

  const resolveNewVersion = () => {
    if (version) {
      const nextVersion =
        typeof version === "function"
          ? version({
              currentVersion,
              packageJson: { ...packageJson },
              level,
              pre,
              inc,
            })
          : version;

      if (!valid(nextVersion)) {
        throw new Error(`Invalid version: ${nextVersion}`);
      }

      return nextVersion;
    }

    if (!level) {
      throw new Error(
        "Release level is required when version is not configured",
      );
    }

    const nextVersion = inc(currentVersion, getReleaseType(), "beta");

    if (!nextVersion) {
      throw new Error(`Failed to increment version from ${currentVersion}`);
    }

    return nextVersion;
  };

  const newVersion = resolveNewVersion();

  const versionUp = () => {
    packageJson.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    consola.info(`New version: ${packageJson.version}`);
  };

  const versionReset = () => {
    packageJson.version = currentVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    consola.info(`Reset version: ${packageJson.version}`);
  };

  return {
    packageName: packageJson.name as string,
    currentVersion,
    newVersion,
    versionUp,
    versionReset,
  };
};
