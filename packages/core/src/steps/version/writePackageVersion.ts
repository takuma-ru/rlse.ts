import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { readPackageJson, writePackageJson } from "../package/utils";
import { resolveOption, type Resolvable } from "../resolveOption";

export const writePackageVersion = (options: {
  packageJsonPath: Resolvable<string>;
  version: Resolvable<string>;
}): RlseStep => ({
  name: "writePackageVersion",
  run: (context) => {
    const packageJsonPath = resolveOption(options.packageJsonPath, context);
    const version = resolveOption(options.version, context);

    const packageJson = readPackageJson(packageJsonPath);
    const previousVersion = packageJson.version;

    packageJson.version = version;
    writePackageJson(packageJsonPath, packageJson);

    const updatedPackageJson = readPackageJson(packageJsonPath);

    consola.info(`New version: ${updatedPackageJson.version}`);

    return {
      packageJsonPath,
      previousVersion,
      version,
    };
  },
  rollback: (context, result) => {
    const published = context.results.some(
      ({ step, value }) =>
        step === "publishNpmPackage" &&
        typeof value === "object" &&
        value !== null &&
        "published" in value &&
        value.published === true,
    );
    const committed = context.results.some(
      ({ step, value }) =>
        step === "commit" &&
        typeof value === "object" &&
        value !== null &&
        "committed" in value &&
        value.committed === true,
    );

    if (committed) {
      consola.info("Skip version reset because commit already succeeded");
      return;
    }

    if (published) {
      consola.info("Skip version reset because publish already succeeded");
      return;
    }

    if (!isWritePackageVersionResult(result.value)) {
      return;
    }

    const packageJson = readPackageJson(result.value.packageJsonPath);
    packageJson.version = result.value.previousVersion;
    writePackageJson(result.value.packageJsonPath, packageJson);
    consola.info(`Reset version: ${result.value.previousVersion}`);
  },
});

const isWritePackageVersionResult = (
  value: unknown,
): value is {
  packageJsonPath: string;
  previousVersion: string | undefined;
  version: string;
} => {
  return (
    typeof value === "object" &&
    value !== null &&
    "packageJsonPath" in value &&
    typeof value.packageJsonPath === "string" &&
    "version" in value &&
    typeof value.version === "string"
  );
};
