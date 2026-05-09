import type { RlseStep } from "../../flow/types";
import { findPackageJsonByName } from "../../utils/findPackageJsonByName";
import { readPackageJson } from "./utils";

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
