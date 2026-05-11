import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

type ConfigureGitUserOptions =
  | { name: string; email?: string }
  | { name?: string; email: string };

export const configureGitUser = (
  options: ConfigureGitUserOptions,
): RlseStep => ({
  name: "configureGitUser",
  run: (context) => {
    if (!options.name && !options.email) {
      throw new Error("Git user name or email must be provided");
    }

    if (context.dryRun) {
      consola.info("[dry-run] Skip git config --local user settings");

      return {
        name: options.name,
        email: options.email,
        scope: "local",
        dryRun: true,
        configured: false,
      };
    }

    if (options?.name) {
      cmdFile("git", ["config", "--local", "user.name", options.name], {
        execOptions: {
          cwd: context.cwd,
          encoding: "utf8",
        },
      });
    }
    if (options?.email) {
      cmdFile("git", ["config", "--local", "user.email", options.email], {
        execOptions: {
          cwd: context.cwd,
          encoding: "utf8",
        },
      });
    }

    return {
      name: options.name,
      email: options.email,
      scope: "local",
      dryRun: false,
      configured: true,
    };
  },
});
