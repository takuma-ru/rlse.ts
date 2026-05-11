import { execFileSync } from "node:child_process";

export const resolveNpmPackageVersion = (
  packageName: string,
  version: string,
  cwd: string,
) => {
  try {
    return execFileSync(
      "npm",
      ["view", `${packageName}@${version}`, "version"],
      {
        cwd,
        stdio: "pipe",
        encoding: "utf8",
      },
    ).trim();
  } catch {
    return "";
  }
};
