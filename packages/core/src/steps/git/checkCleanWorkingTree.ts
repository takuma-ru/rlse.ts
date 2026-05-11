import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const checkCleanWorkingTree = (options?: {
  allowUntracked?: boolean;
}): RlseStep => ({
  name: "checkCleanWorkingTree",
  run: (context) => {
    const status = cmdFile("git", ["status", "--porcelain"], {
      execOptions: {
        cwd: context.cwd,
        stdio: "pipe",
        encoding: "utf8",
      },
      successCallback: (stdout) => stdout.trim(),
    });
    const dirtyEntries = status
      .split("\n")
      .filter((entry) => entry.length > 0)
      .filter((entry) => !(options?.allowUntracked && entry.startsWith("??")));

    if (dirtyEntries.length) {
      throw new Error(`Working tree is not clean:\n${dirtyEntries.join("\n")}`);
    }

    consola.success("Working tree is clean");

    return {
      clean: true,
      allowUntracked: options?.allowUntracked ?? false,
    };
  },
});
