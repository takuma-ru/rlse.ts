import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const stageFiles = (options: {
  paths: Resolvable<string[]>;
}): RlseStep => ({
  name: "stageFiles",
  run: (context) => {
    const paths = resolveOption(options.paths, context);

    if (!paths.length) {
      throw new Error("Files must be provided before stageFiles");
    }

    cmdFile("git", ["add", ...paths], {
      successCallback: (stdout) => {
        consola.success(`Added ${paths.join(", ")}`);
        return stdout;
      },
    });

    return {
      paths,
    };
  },
});
