import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { getCurrentBranch } from "./utils";

export const push = (options?: {
  branch?: string | ((context: Parameters<RlseStep["run"]>[0]) => string);
  setUpstream?: boolean;
}): RlseStep => ({
  name: "push",
  run: (context) => {
    const targetBranch =
      typeof options?.branch === "function"
        ? options.branch(context)
        : (options?.branch ??
          context.releaseBranch ??
          context.baseBranch ??
          getCurrentBranch());
    const args = options?.setUpstream
      ? ["push", "--set-upstream", "origin", targetBranch]
      : ["push", "origin", targetBranch];

    cmdFile("git", args, {
      successCallback: (stdout) => {
        consola.success(`Pushed to ${targetBranch}`);
        return stdout;
      },
    });
  },
});
