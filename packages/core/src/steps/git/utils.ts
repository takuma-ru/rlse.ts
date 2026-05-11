import { cmdFile } from "../../utils/cmd";

export const getCurrentBranch = (cwd?: string) => {
  return cmdFile("git", ["branch", "--show-current"], {
    execOptions: {
      cwd,
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => stdout.trim(),
  });
};

export const getStagedFiles = (cwd?: string) => {
  return cmdFile("git", ["diff", "--cached", "--name-only"], {
    execOptions: {
      cwd,
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => stdout.trim(),
  });
};
