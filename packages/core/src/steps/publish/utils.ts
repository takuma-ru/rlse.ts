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
    errorCallback: (error) => {
      if (isNpmNotFoundError(error)) {
        return "";
      }

      throw error;
    },
    silentError: isNpmNotFoundError,
  });
};

const isNpmNotFoundError = (error: NodeJS.ErrnoException) => {
  const stderr = "stderr" in error ? String(error.stderr) : "";
  const message = `${error.message}\n${stderr}`;

  return message.includes("E404") || message.includes("404 Not Found");
};
