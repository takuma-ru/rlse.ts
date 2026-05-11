import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const push = (options: {
  branch: string;
  remote?: string;
  setUpstream?: boolean;
}): RlseStep => ({
  name: "push",
  run: (context) => {
    const remote = options.remote ?? "origin";
    const args = options?.setUpstream
      ? ["push", "--set-upstream", remote, options.branch]
      : ["push", remote, options.branch];

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git ${args.join(" ")}`);

      return {
        branch: options.branch,
        remote,
        setUpstream: options.setUpstream ?? false,
        dryRun: true,
        pushed: false,
      };
    }

    cmdFile("git", args, {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Pushed to ${options.branch}`);
        return stdout;
      },
    });

    return {
      branch: options.branch,
      remote,
      setUpstream: options.setUpstream ?? false,
      dryRun: false,
      pushed: true,
    };
  },
});
