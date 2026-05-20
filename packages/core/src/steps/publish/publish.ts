import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const publishNpmPackage = (options: {
  packageName: Resolvable<string>;
  packageDir?: Resolvable<string>;
  dryRun?: boolean;
  dryRunVersion?: Resolvable<string>;
}): RlseStep => ({
  name: "publishNpmPackage",
  run: (context) => {
    const packageName = resolveOption(options.packageName, context);
    const packageDir = options.packageDir
      ? resolveOption(options.packageDir, context)
      : context.cwd;
    const dryRun = options.dryRun ?? context.dryRun;
    const dryRunVersion = options.dryRunVersion
      ? resolveOption(options.dryRunVersion, context)
      : undefined;

    const publishArgs = ["publish"];
    if (dryRun) {
      publishArgs.push("--dry-run");
    }

    if (dryRun && dryRunVersion) {
      withTemporaryPackageVersion(packageDir, dryRunVersion, () => {
        publish(packageDir, packageName, publishArgs);
      });
    } else {
      publish(packageDir, packageName, publishArgs);
    }

    return {
      packageName,
      packageDir,
      dryRun,
      dryRunVersion,
      published: !dryRun,
    };
  },
});

const publish = (
  packageDir: string,
  packageName: string,
  publishArgs: string[],
) => {
  cmdFile("npm", publishArgs, {
    execOptions: {
      cwd: packageDir,
      encoding: "utf8",
    },
    successCallback: (stdout) => {
      consola.success(`Published ${packageName}`);
      return stdout;
    },
  });
};

const withTemporaryPackageVersion = (
  packageDir: string,
  version: string,
  callback: () => void,
) => {
  const packageJsonPath = path.join(packageDir, "package.json");
  const originalPackageJson = readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(originalPackageJson) as Record<
    string,
    unknown
  >;

  packageJson.version = version;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  try {
    callback();
  } finally {
    writeFileSync(packageJsonPath, originalPackageJson);
  }
};
