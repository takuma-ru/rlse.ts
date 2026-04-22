import process from "node:process";
import consola from "consola";
import { cmd, cmdFile } from "../utils/cmd";
import { parseReleaseSchema } from "../validation/validation";
import { findPackageJsonByName } from "./findPackageJsonByName";
import { getSkipStep } from "./getSkipStep";
import { packageVersionControl } from "./packageVersionControl";

export const releaseAction = async (options: unknown) => {
  // == Validation ==
  const {
    name,
    pre,
    level,
    buildCmd,
    gitUserName,
    gitUserEmail,
    skipStep,
    dryRun,
    releaseVersion,
  } = parseReleaseSchema(options);

  const {
    isAllStepSkipped,
    isConfigStepSkipped,
    isCommitChangesStepSkipped,
    isBuildStepSkipped,
    isPublishStepSkipped,
    isCreateReleaseBranchStepSkipped,
  } = getSkipStep(skipStep);

  if (isAllStepSkipped) {
    consola.info("All steps are skipped");
    process.exit(0);
  }

  // == Package info ==
  const packageJsonPath = await findPackageJsonByName(name);
  if (!packageJsonPath) {
    consola.error(`package.json for ${name} not found`);
    process.exit(1);
  }

  if (!isConfigStepSkipped) {
    if (gitUserName) {
      cmdFile("git", ["config", "--local", "user.name", gitUserName]);
    }
    if (gitUserEmail) {
      cmdFile("git", ["config", "--local", "user.email", gitUserEmail]);
    }
  }

  const { newVersion, packageName, versionUp, versionReset } =
    packageVersionControl({
      level,
      pre,
      releaseVersion,
      packageJsonPath,
    });

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
  const releaseBranch = isCreateReleaseBranchStepSkipped
    ? baseBranch
    : `release/${packageName}.${newVersion}`;

  const resetAction = () => {
    if (isCommitChangesStepSkipped) {
      versionReset();
    } else {
      cmdFile("git", ["checkout", "--", packageJsonPath]);
    }
    if (!isCreateReleaseBranchStepSkipped) {
      cmdFile("git", ["switch", baseBranch]);
      cmdFile("git", ["branch", "-D", releaseBranch]);
      cmdFile("git", ["push", "origin", "--delete", releaseBranch]);
    }
  };

  // == Actions ==
  try {
    versionUp();

    if (!isCreateReleaseBranchStepSkipped) {
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
    }

    if (!isBuildStepSkipped) {
      cmd(buildCmd, {
        execOptions: {
          cwd: process.cwd(),
          encoding: "utf8",
        },
        successCallback: (stdout) => {
          consola.success("Build success");
          return stdout;
        },
      });
    }

    if (!isCommitChangesStepSkipped) {
      cmdFile("git", ["add", packageJsonPath], {
        successCallback: (stdout) => {
          consola.success(`Added ${packageJsonPath}`);
          return stdout;
        },
      });
      cmdFile("git", ["commit", "-m", `Release ${packageName} ${newVersion}`], {
        successCallback: (stdout) => {
          consola.success(`Committed ${packageName} ${newVersion}`);
          return stdout;
        },
      });
      cmdFile("git", ["push", "origin", releaseBranch], {
        successCallback: (stdout) => {
          consola.success(`Pushed ${packageName} ${newVersion}`);
          return stdout;
        },
      });
    }

    if (!isPublishStepSkipped) {
      const publishArgs = [
        "publish",
        "--filter",
        packageName,
        "--no-git-checks",
      ];
      if (dryRun) {
        publishArgs.push("--dry-run");
      }

      cmdFile("pnpm", publishArgs, {
        successCallback: (stdout) => {
          consola.success(`Published ${packageName} ${newVersion}`);

          if (dryRun) {
            resetAction();
          }

          return stdout;
        },
      });
    }
  } catch (error) {
    consola.error(error);
    resetAction();
    process.exit(1);
  }
};
