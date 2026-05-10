import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const stageFiles = (options?: { paths?: string[] }): RlseStep => ({
  name: "stageFiles",
  run: (context) => {
    const paths =
      options?.paths ??
      (context.packageJsonPath ? [context.packageJsonPath] : undefined);

    if (!paths?.length) {
      throw new Error("Files must be provided before stageFiles");
    }

    cmdFile("git", ["add", ...paths], {
      successCallback: (stdout) => {
        consola.success(`Added ${paths.join(", ")}`);
        return stdout;
      },
    });
  },
});
