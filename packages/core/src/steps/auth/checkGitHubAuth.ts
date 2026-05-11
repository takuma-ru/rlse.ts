import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const checkGitHubAuth = (): RlseStep => ({
  name: "checkGitHubAuth",
  run: (context) => {
    cmdFile("gh", ["auth", "status"], {
      execOptions: {
        cwd: context.cwd,
        stdio: "pipe",
        encoding: "utf8",
      },
    });

    consola.success("GitHub authentication is available");

    return {
      authenticated: true,
    };
  },
});

export const checkAuth = (): RlseStep => ({
  ...checkGitHubAuth(),
  name: "checkAuth",
});
