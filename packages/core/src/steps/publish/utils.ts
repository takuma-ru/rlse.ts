import { cmdFile } from "../../utils/cmd";

export const resolveNpmPackageVersion = (
  packageName: string,
  version: string,
  cwd: string,
) => {
  return cmdFile("npm", ["view", `${packageName}@${version}`, "version"], {
    execOptions: {
      cwd,
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => stdout.trim(),
    errorCallback: () => "",
    silentError: true,
  });
};
