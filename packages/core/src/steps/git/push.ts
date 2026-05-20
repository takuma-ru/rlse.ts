import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";
import type { GitArtifactIfExists } from "./releaseArtifacts";

export const push = (options: {
  branch: Resolvable<string>;
  remote?: Resolvable<string>;
  setUpstream?: Resolvable<boolean>;
  ifExists?: Resolvable<GitArtifactIfExists>;
}): RlseStep => ({
  name: "push",
  run: (context) => {
    const branch = resolveOption(options.branch, context);
    const remote = options.remote
      ? resolveOption(options.remote, context)
      : "origin";
    const setUpstream = options.setUpstream
      ? resolveOption(options.setUpstream, context)
      : false;
    const ifExists = options.ifExists
      ? resolveOption(options.ifExists, context)
      : "fail";
    const args = setUpstream
      ? ["push", "--set-upstream", remote, branch]
      : ["push", remote, branch];
    const remoteHead = context.dryRun
      ? false
      : getRemoteBranchHead(remote, branch, context.cwd);
    const exists = Boolean(remoteHead);

    if (exists && ifExists === "skip") {
      consola.info(
        `Branch ${branch} already exists on ${remote}; skipping push`,
      );

      return {
        branch,
        remote,
        setUpstream,
        dryRun: context.dryRun,
        pushed: false,
        skipped: true,
        replaced: false,
      };
    }

    if (exists && ifExists === "replace") {
      args.splice(
        1,
        0,
        `--force-with-lease=refs/heads/${branch}:${remoteHead}`,
      );
    }

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git ${args.join(" ")}`);

      return {
        branch,
        remote,
        setUpstream,
        dryRun: true,
        pushed: false,
        skipped: false,
        replaced: false,
      };
    }

    cmdFile("git", args, {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Pushed to ${branch}`);
        return stdout;
      },
    });

    return {
      branch,
      remote,
      setUpstream,
      dryRun: false,
      pushed: true,
      skipped: false,
      replaced: exists && ifExists === "replace",
    };
  },
});

const getRemoteBranchHead = (remote: string, branch: string, cwd: string) => {
  const stdout = cmdFile(
    "git",
    ["ls-remote", "--exit-code", "--heads", remote, branch],
    {
      execOptions: {
        cwd,
        stdio: "pipe",
        encoding: "utf8",
      },
      errorCallback: () => "",
      silentError: true,
    },
  );

  return stdout.trim().split(/\s+/)[0];
};
