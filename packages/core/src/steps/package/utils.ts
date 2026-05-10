import { readFileSync, writeFileSync } from "node:fs";

export type PackageJson = Record<string, unknown> & {
  name?: string;
  version?: string;
};

export const readPackageJson = (packageJsonPath: string) => {
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
};

export const writePackageJson = (
  packageJsonPath: string,
  packageJson: PackageJson,
) => {
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};
