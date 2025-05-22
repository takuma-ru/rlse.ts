import process from "node:process";
import consola from "consola";
import { cmd } from "../utils/cmd";
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
    version
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
      cmd(`git config --local user.name ${gitUserName}`);
    }
    if (gitUserEmail) {
      cmd(`git config --local user.email ${gitUserEmail}`);
    }
  }

  const baseBranch = cmd("git branch --show-current", {
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
    : `release/${new Date().toISOString().replace(/[-:.]/g, "_")}`;

  const { newVersion, packageName, versionUp, versionReset } =
    packageVersionControl({
      level,
      pre,
      version,
      packageJsonPath,
    });

  const resetAction = () => {
    if (isCommitChangesStepSkipped) {
      versionReset();
    } else {
      cmd(`git checkout -- ${packageJsonPath}`);
    }
    if (!isCreateReleaseBranchStepSkipped) {
      cmd(`git switch ${baseBranch}`);
      cmd(`git branch -D ${releaseBranch}`);
      cmd(`git push origin --delete ${releaseBranch}`);
    }
  };

  // == Actions ==
  try {
    versionUp();

    if (!isCreateReleaseBranchStepSkipped) {
      cmd(`git switch -c ${releaseBranch}`, {
        successCallback: (stdout) => {
          consola.success(`Switched to ${releaseBranch}`);
          return stdout;
        },
      });
      cmd(`git push --set-upstream origin ${releaseBranch}`, {
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
      cmd(`git add ${packageJsonPath}`, {
        successCallback: (stdout) => {
          consola.success(`Added ${packageJsonPath}`);
          return stdout;
        },
      });
      cmd(`git commit -m "Release ${packageName} ${newVersion}"`, {
        successCallback: (stdout) => {
          consola.success(`Committed ${packageName} ${newVersion}`);
          return stdout;
        },
      });
      cmd(`git push origin ${releaseBranch}`, {
        successCallback: (stdout) => {
          consola.success(`Pushed ${packageName} ${newVersion}`);
          return stdout;
        },
      });
    }

    if (!isPublishStepSkipped) {
      cmd(
        `pnpm publish --filter ${packageName} --no-git-checks ${
          dryRun ? "--dry-run" : ""
        }`,
        {
          successCallback: (stdout) => {
            consola.success(`Published ${packageName} ${newVersion}`);

            if (dryRun) {
              resetAction();
            }

            return stdout;
          },
        },
      );
    }
  } catch (error) {
    consola.error(error);
    resetAction();
    process.exit(1);
  }
};
