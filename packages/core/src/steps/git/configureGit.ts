import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

type ConfigureGitUserOptions =
  | { name: string; email?: string }
  | { name?: string; email: string };

export const configureGitUser = (
  options: ConfigureGitUserOptions,
): RlseStep => ({
  name: "configureGitUser",
  run: () => {
    if (!options.name && !options.email) {
      throw new Error("Git user name or email must be provided");
    }

    if (options?.name) {
      cmdFile("git", ["config", "--local", "user.name", options.name]);
    }
    if (options?.email) {
      cmdFile("git", ["config", "--local", "user.email", options.email]);
    }

    return {
      name: options.name,
      email: options.email,
      scope: "local",
    };
  },
});
