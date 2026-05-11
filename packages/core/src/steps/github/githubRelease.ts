import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const githubRelease = (options: {
  tag: Resolvable<string>;
  title?: Resolvable<string>;
  notes?: Resolvable<string>;
  draft?: Resolvable<boolean>;
  prerelease?: Resolvable<boolean>;
}): RlseStep => ({
  name: "githubRelease",
  run: (context) => {
    const tag = resolveOption(options.tag, context);
    const title = options.title ? resolveOption(options.title, context) : tag;
    const notes = options.notes
      ? resolveOption(options.notes, context)
      : undefined;
    const draft = options.draft ? resolveOption(options.draft, context) : false;
    const prerelease = options.prerelease
      ? resolveOption(options.prerelease, context)
      : false;
    const args = ["release", "create", tag, "--title", title];

    if (notes) {
      args.push("--notes", notes);
    } else {
      args.push("--generate-notes");
    }

    if (draft) {
      args.push("--draft");
    }
    if (prerelease) {
      args.push("--prerelease");
    }

    if (context.dryRun) {
      consola.info(`[dry-run] Skip gh ${args.join(" ")}`);

      return {
        tag,
        title,
        notes,
        draft,
        prerelease,
        dryRun: true,
        released: false,
      };
    }

    cmdFile("gh", args, {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success(`Created GitHub release ${tag}`);
        return stdout;
      },
    });

    return {
      tag,
      title,
      notes,
      draft,
      prerelease,
      dryRun: false,
      released: true,
    };
  },
  rollback: (context, result) => {
    if (!isGitHubReleaseResult(result.value) || !result.value.released) {
      return;
    }

    cmdFile("gh", ["release", "delete", result.value.tag, "--yes"], {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
    });
  },
});

const isGitHubReleaseResult = (
  value: unknown,
): value is { tag: string; released: boolean } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "tag" in value &&
    typeof value.tag === "string" &&
    "released" in value &&
    typeof value.released === "boolean"
  );
};
