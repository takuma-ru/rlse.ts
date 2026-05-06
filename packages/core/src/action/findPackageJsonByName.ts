import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

export const findPackageJsonByName = async (
  name: string,
): Promise<string | null> => {
  async function searchDirectory(directory: string): Promise<string | null> {
    const items = await readdir(directory, { withFileTypes: true });

    for (const item of items) {
      const itemPath = join(directory, item.name);

      if (item.isDirectory()) {
        const result = await searchDirectory(itemPath);

        if (result) return result;
      } else if (item.name === "package.json") {
        const content = await readFile(itemPath, "utf8");
        const packageJson = JSON.parse(content);

        if (packageJson.name === name) {
          return itemPath;
        }
      }
    }

    return null;
  }

  return await searchDirectory(cwd());
};
