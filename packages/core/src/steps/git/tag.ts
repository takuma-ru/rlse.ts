import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const tag = (options: {
  name: Resolvable<string>;
  message?: Resolvable<string>;
}): RlseStep => ({
  name: "tag",
  run: (context) => {
    const name = resolveOption(options.name, context);
    const message = options.message
      ? resolveOption(options.message, context)
      : undefined;
    const args = message ? ["tag", "-a", name, "-m", message] : ["tag", name];

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git ${args.join(" ")}`);

      return {
        name,
        message,
        dryRun: true,
        tagged: false,
      };
    }

    cmdFile("git", args, {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Tagged ${name}`);
        return stdout;
      },
    });

    return {
      name,
      message,
      dryRun: false,
      tagged: true,
    };
  },
  rollback: (context, result) => {
    if (!isTagResult(result.value) || !result.value.tagged) {
      return;
    }

    cmdFile("git", ["tag", "-d", result.value.name], {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
    });
  },
});

const isTagResult = (
  value: unknown,
): value is { name: string; tagged: boolean } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string" &&
    "tagged" in value &&
    typeof value.tagged === "boolean"
  );
};
