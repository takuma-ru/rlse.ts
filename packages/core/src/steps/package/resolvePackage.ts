import type { RlseStep } from "../../flow/types";
import { findPackageJsonByName } from "../../utils/findPackageJsonByName";
import { readPackageJson } from "./utils";

export const resolvePackage = (options: { name: string }): RlseStep => ({
  name: "resolvePackage",
  run: async () => {
    const packageJsonPath = await findPackageJsonByName(options.name);

    if (!packageJsonPath) {
      throw new Error(`package.json for ${options.name} not found`);
    }

    const packageJson = readPackageJson(packageJsonPath);

    return {
      packageJsonPath,
      packageJson,
      packageName: packageJson.name,
    };
  },
});
