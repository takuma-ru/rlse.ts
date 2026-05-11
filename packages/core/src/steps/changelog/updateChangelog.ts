import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { resolveOption, type Resolvable } from "../resolveOption";

export const updateChangelog = (options: {
  version: Resolvable<string>;
  path?: Resolvable<string>;
  date?: Resolvable<string>;
  changes?: Resolvable<string[]>;
}): RlseStep => ({
  name: "updateChangelog",
  run: (context) => {
    const changelogPath = resolve(
      context.cwd,
      options.path ? resolveOption(options.path, context) : "CHANGELOG.md",
    );
    const version = resolveOption(options.version, context);
    const date = options.date
      ? resolveOption(options.date, context)
      : new Date().toISOString().slice(0, 10);
    const changes = options.changes
      ? resolveOption(options.changes, context)
      : [];
    const previousContent = existsSync(changelogPath)
      ? readFileSync(changelogPath, "utf8")
      : undefined;
    const nextEntry = createChangelogEntry(version, date, changes);
    const nextContent = previousContent
      ? insertChangelogEntry(previousContent, nextEntry)
      : `# Changelog\n\n${nextEntry}`;

    if (context.dryRun) {
      consola.info(`[dry-run] Skip updating ${changelogPath}`);

      return {
        path: changelogPath,
        version,
        date,
        changes,
        dryRun: true,
        updated: false,
      };
    }

    writeFileSync(changelogPath, nextContent);
    consola.success(`Updated changelog ${changelogPath}`);

    return {
      path: changelogPath,
      version,
      date,
      changes,
      previousContent,
      dryRun: false,
      updated: true,
    };
  },
  rollback: (_, result) => {
    if (!isUpdateChangelogResult(result.value) || !result.value.updated) {
      return;
    }

    if (result.value.previousContent === undefined) {
      rmSync(result.value.path, { force: true });
      return;
    }

    writeFileSync(result.value.path, result.value.previousContent);
  },
});

const createChangelogEntry = (
  version: string,
  date: string,
  changes: string[],
) => {
  const body = changes.length
    ? changes.map((change) => `- ${change}`).join("\n")
    : "- Release changes.";

  return `## ${version} - ${date}\n\n${body}\n\n`;
};

const insertChangelogEntry = (content: string, entry: string) => {
  const headingMatch = content.match(/^# .+\n+/);

  if (!headingMatch?.[0]) {
    return `${entry}${content}`;
  }

  return `${headingMatch[0]}${entry}${content.slice(headingMatch[0].length)}`;
};

const isUpdateChangelogResult = (
  value: unknown,
): value is {
  path: string;
  previousContent?: string;
  updated: boolean;
} => {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    typeof value.path === "string" &&
    "updated" in value &&
    typeof value.updated === "boolean"
  );
};
