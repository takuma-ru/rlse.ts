import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";
import type { GitArtifactIfExists } from "./releaseArtifacts";

export const tag = (options: {
  name: Resolvable<string>;
  message?: Resolvable<string>;
  ifExists?: Resolvable<GitArtifactIfExists>;
}): RlseStep => ({
  name: "tag",
  run: (context) => {
    const name = resolveOption(options.name, context);
    const message = options.message
      ? resolveOption(options.message, context)
      : undefined;
    const ifExists = options.ifExists
      ? resolveOption(options.ifExists, context)
      : "fail";
    const args = message ? ["tag", "-a", name, "-m", message] : ["tag", name];
    const exists = tagExists(name, context.cwd);

    if (exists && ifExists === "skip") {
      consola.info(`Tag ${name} already exists; skipping`);

      return {
        name,
        message,
        dryRun: context.dryRun,
        tagged: false,
        skipped: true,
        replaced: false,
      };
    }

    if (context.dryRun) {
      consola.info(`[dry-run] Skip git ${args.join(" ")}`);

      return {
        name,
        message,
        dryRun: true,
        tagged: false,
        skipped: false,
        replaced: false,
      };
    }

    if (exists && ifExists === "replace") {
      cmdFile("git", ["tag", "-d", name], {
        execOptions: {
          cwd: context.cwd,
          encoding: "utf8",
        },
      });
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
      skipped: false,
      replaced: exists && ifExists === "replace",
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

const tagExists = (name: string, cwd: string) => {
  return Boolean(
    cmdFile("git", ["rev-parse", "--verify", `refs/tags/${name}`], {
      execOptions: {
        cwd,
        stdio: "pipe",
        encoding: "utf8",
      },
      errorCallback: () => "",
      silentError: true,
    }),
  );
};
