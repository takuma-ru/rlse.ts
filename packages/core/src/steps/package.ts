import { readFileSync, writeFileSync } from "node:fs";
import { findPackageJsonByName } from "../action/findPackageJsonByName";
import type { RlseStep } from "../flow/types";

export type PackageJson = Record<string, unknown> & {
  name?: string;
  version?: string;
};

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

export const readPackageJson = (packageJsonPath: string) => {
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
};

export const writePackageJson = (
  packageJsonPath: string,
  packageJson: PackageJson,
) => {
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};
