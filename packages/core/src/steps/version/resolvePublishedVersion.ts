import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const resolvePublishedVersion = (options: {
  packageName: Resolvable<string>;
  fallbackVersion?: Resolvable<string>;
}): RlseStep => ({
  name: "resolvePublishedVersion",
  run: (context) => {
    const packageName = resolveOption(options.packageName, context);
    let source: "registry" | "fallback" = "registry";

    const currentVersion = cmdFile("npm", ["show", packageName, "version"], {
      execOptions: {
        stdio: "pipe",
        encoding: "utf8",
      },
      successCallback: (stdout) => stdout.trim(),
      errorCallback: () => {
        source = "fallback";
        return options.fallbackVersion
          ? resolveOption(options.fallbackVersion, context)
          : "0.0.0";
      },
    });

    consola.info(`Current version: ${currentVersion}`);

    return {
      packageName,
      currentVersion,
      source,
    };
  },
});
