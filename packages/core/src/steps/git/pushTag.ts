import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";
import type { GitArtifactIfExists } from "./releaseArtifacts";

export const pushTag = (options: {
  tag: Resolvable<string>;
  remote?: Resolvable<string>;
  ifExists?: Resolvable<GitArtifactIfExists>;
}): RlseStep => ({
  name: "pushTag",
  run: (context) => {
    const tag = resolveOption(options.tag, context);
    const remote = options.remote
      ? resolveOption(options.remote, context)
      : "origin";
    const ifExists = options.ifExists
      ? resolveOption(options.ifExists, context)
      : "fail";
    const args = ["push", remote, `refs/tags/${tag}`];
    const remoteHead = context.dryRun
      ? false
      : getRemoteTagHead(remote, tag, context.cwd);
    const exists = Boolean(remoteHead);

    if (exists && ifExists === "skip") {
      consola.info(`Tag ${tag} already exists on ${remote}; skipping push`);

      return {
        tag,
        remote,
        dryRun: context.dryRun,
        pushed: false,
        skipped: true,
        replaced: false,
      };
    }

    if (exists && ifExists === "replace") {
      args.splice(1, 0, `--force-with-lease=refs/tags/${tag}:${remoteHead}`);
    }

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git ${args.join(" ")}`);

      return {
        tag,
        remote,
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
        consola.success(`Pushed tag ${tag} to ${remote}`);
        return stdout;
      },
    });

    return {
      tag,
      remote,
      dryRun: false,
      pushed: true,
      skipped: false,
      replaced: exists && ifExists === "replace",
    };
  },
  rollback: (context, result) => {
    if (!isPushTagResult(result.value) || !result.value.pushed) {
      return;
    }

    cmdFile(
      "git",
      ["push", result.value.remote, `:refs/tags/${result.value.tag}`],
      {
        execOptions: {
          cwd: context.cwd,
          encoding: "utf8",
        },
      },
    );
  },
});

const isPushTagResult = (
  value: unknown,
): value is { tag: string; remote: string; pushed: boolean } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "tag" in value &&
    typeof value.tag === "string" &&
    "remote" in value &&
    typeof value.remote === "string" &&
    "pushed" in value &&
    typeof value.pushed === "boolean"
  );
};

const getRemoteTagHead = (remote: string, tag: string, cwd: string) => {
  const stdout = cmdFile(
    "git",
    ["ls-remote", "--exit-code", "--refs", "--tags", remote, tag],
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
