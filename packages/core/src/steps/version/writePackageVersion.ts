import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { readPackageJson, writePackageJson } from "../package/utils";

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
    if (context.committed) {
      consola.info("Skip version reset because commit already succeeded");
      return;
    }

    if (context.published) {
      consola.info("Skip version reset because publish already succeeded");
      return;
    }

    context.versionReset?.();
  },
});
