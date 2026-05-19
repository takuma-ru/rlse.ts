import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const pushTag = (options: {
  tag: Resolvable<string>;
  remote?: Resolvable<string>;
}): RlseStep => ({
  name: "pushTag",
  run: (context) => {
    const tag = resolveOption(options.tag, context);
    const remote = options.remote
      ? resolveOption(options.remote, context)
      : "origin";
    const args = ["push", remote, `refs/tags/${tag}`];

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git ${args.join(" ")}`);

      return {
        tag,
        remote,
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
        consola.success(`Pushed tag ${tag} to ${remote}`);
        return stdout;
      },
    });

    return {
      tag,
      remote,
      dryRun: false,
      pushed: true,
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
