import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const resolvePublishedVersion = (): RlseStep => ({
  name: "resolvePublishedVersion",
  run: (context) => {
    if (!context.packageJsonPath || !context.packageName) {
      throw new Error(
        "Package must be resolved before resolvePublishedVersion",
      );
    }

    context.currentVersion = cmdFile(
      "npm",
      ["show", context.packageName, "version"],
      {
        execOptions: {
          stdio: "pipe",
          encoding: "utf8",
        },
        successCallback: (stdout) => stdout.trim(),
        errorCallback: (error) => {
          consola.error(error.message);
          return context.packageJson?.version ?? "0.0.0";
        },
      },
    );

    consola.info(`Current version: ${context.currentVersion}`);
  },
});
