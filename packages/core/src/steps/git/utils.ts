import { cmdFile } from "../../utils/cmd";

export const getCurrentBranch = () => {
  return cmdFile("git", ["branch", "--show-current"], {
    execOptions: {
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => stdout.trim(),
  });
};

export const getStagedFiles = () => {
  return cmdFile("git", ["diff", "--cached", "--name-only"], {
    execOptions: {
      stdio: "pipe",
      encoding: "utf8",
    },
    successCallback: (stdout) => stdout.trim(),
  });
};
