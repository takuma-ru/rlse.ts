import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const checkNpmToken = (): RlseStep => ({
  name: "checkNpmToken",
  run: (context) => {
    const username = cmdFile("npm", ["whoami"], {
      execOptions: {
        cwd: context.cwd,
        stdio: "pipe",
        encoding: "utf8",
      },
      successCallback: (stdout) => stdout.trim(),
    });

    consola.success(`npm authentication is available as ${username}`);

    return {
      authenticated: true,
      username,
    };
  },
});
