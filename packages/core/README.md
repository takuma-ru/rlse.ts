# @takuma-ru/rlse

TypeScript release workflow runner with reusable safety steps.

Rlse is for package authors who want release flows to be explicit code, not a
large CLI preset or a one-off `scripts/release.ts`. Start with a preset, then add
or reorder typed steps for checks, versioning, publishing, tags, changelogs, and
GitHub Releases.

- Safer than a one-off `release.ts`: reusable steps, rollback hooks, dry-run, and
  typed step results.
- More explicit than `release-it`: the release flow is normal TypeScript code.
- Lighter than `changesets`: no changeset files or monorepo planner required for
  simple package releases.

## Getting Started

### 1. Install

```shell
npm install @takuma-ru/rlse
```

### 2. Add script to package.json

```json filename=package.json
{
  "scripts": {
    "rlse": "rlse"
  }
}
```

### 3. Run

```shell
npm run rlse
```

## Configure settings via Setting file

Create `rlse.config.ts` in the project root and export a release flow.
In addition to ts, the following file formats are supported.

- `rlse.config.ts`
- `rlse.config.js`
  - `rlse.config.mjs`
  - `rlse.config.cjs`
- `rlse.config.json`

### Example

```ts filename=rlse.config.ts
import { defineConfig, presets } from "@takuma-ru/rlse";

export default defineConfig(
  presets.npmRelease({
    resolvePackage: { name: "vanilla-ts" },
    calculateNextSemver: {
      version: ({ currentVersion, inc }) =>
        inc(currentVersion, "prerelease", "beta")!,
    },
    runCommand: "pnpm build",
  }),
);
```

The release preset includes the common npm safety checks. Add optional steps
around it when your release needs extra side effects, such as GitHub Releases or
changelog updates.

```ts filename=rlse.config.ts
import { defineConfig, presets, steps } from "@takuma-ru/rlse";

export default defineConfig([
  steps.checkCleanWorkingTree(),
  ...presets.npmRelease({
    resolvePackage: { name: "vanilla-ts" },
    calculateNextSemver: { level: "patch" },
    runCommand: "pnpm build",
    commit: { message: "Release vanilla-ts" },
    push: { branch: "main" },
  }),
]);
```

Use primitives directly only when you need full control over every side effect.

```ts filename=rlse.config.ts
import { defineConfig, steps } from "@takuma-ru/rlse";

export default defineConfig([
  steps.resolvePackage({ name: "vanilla-ts" }),
  steps.resolvePublishedVersion({
    packageName: ({ results }) =>
      results.findStep("resolvePackage").packageName,
  }),
  steps.calculateNextSemver({
    currentVersion: ({ results }) =>
      results.findStep("resolvePublishedVersion").currentVersion,
    level: "patch",
  }),
  steps.writePackageVersion({
    packageJsonPath: ({ results }) =>
      results.findStep("resolvePackage").packageJsonPath,
    version: ({ results }) =>
      results.findStep("calculateNextSemver").nextVersion,
  }),
  steps.runCommand("pnpm build"),
  steps.stageFiles({
    paths: ({ results }) => [
      results.findStep("resolvePackage").packageJsonPath,
    ],
  }),
  steps.commit({ message: "Release vanilla-ts" }),
  steps.tag({
    name: ({ results }) =>
      `v${results.findStep("calculateNextSemver").nextVersion}`,
  }),
  steps.publishNpmPackage({ packageName: "vanilla-ts" }),
  steps.push({ branch: "main" }),
]);
```

The default npm preset checks whether the next npm version is unpublished,
publishes, verifies the package on the npm registry, commits before publishing,
and pushes after publishing. If `publish` succeeds but `push` fails, rerun after
fixing git access or push the created commit manually.

### API

Rlse exports `defineConfig`, `presets`, `steps`, `runFlow`, and `z`.

#### Presets

| API                           | Description                                                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `presets.npmRelease(options)` | Builds the common npm release flow: resolve package, calculate version, write version, optionally run a command, commit, check npm availability, publish, verify publish, and push. |

#### Step Groups

Use presets for the common path. Use individual steps when you need to insert,
remove, or reorder release side effects.

| Group           | Steps                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| Auth checks     | `checkAuth`, `checkGitHubAuth`, `checkNpmToken`                                           |
| Package/version | `resolvePackage`, `resolvePublishedVersion`, `calculateNextSemver`, `writePackageVersion` |
| Safety checks   | `checkCleanWorkingTree`, `checkNpmPackageVersionAvailable`, `verifyPublishedNpmPackage`   |
| Git operations  | `configureGitUser`, `createReleaseBranch`, `stageFiles`, `commit`, `tag`, `push`          |
| Release outputs | `publishNpmPackage`, `githubRelease`, `updateChangelog`                                   |
| Commands        | `runCommand`                                                                              |

#### Step Reference

The following steps are exported from `steps`.

**Auth**

| Step                      | Description                                          | Options |
| ------------------------- | ---------------------------------------------------- | ------- |
| `steps.checkAuth()`       | Alias of `checkGitHubAuth`.                          | None.   |
| `steps.checkGitHubAuth()` | Fails when GitHub CLI authentication is unavailable. | None.   |
| `steps.checkNpmToken()`   | Fails when npm authentication is unavailable.        | None.   |

**Package And Version**

| Step                                     | Description                                                                | Options                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `steps.resolvePackage({ name })`         | Finds the target `package.json` by package name.                           | `name`.                                                     |
| `steps.resolvePublishedVersion(options)` | Reads the currently published npm version for a package.                   | `packageName`, `fallbackVersion`.                           |
| `steps.calculateNextSemver(options)`     | Calculates the next semver version.                                        | `currentVersion`, `packageJson`, `level`, `pre`, `version`. |
| `steps.writePackageVersion(options)`     | Writes a version to a `package.json`. Rolls back before commit or publish. | `packageJsonPath`, `version`.                               |

**Safety**

| Step                                             | Description                                                                 | Options                   |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------- |
| `steps.checkCleanWorkingTree(options)`           | Fails when the git working tree has uncommitted changes.                    | `allowUntracked`.         |
| `steps.checkNpmPackageVersionAvailable(options)` | Fails when the target npm package version already exists.                   | `packageName`, `version`. |
| `steps.verifyPublishedNpmPackage(options)`       | Verifies that the published npm package version is visible on the registry. | `packageName`, `version`. |

**Git**

| Step                                 | Description                                              | Options                            |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------- |
| `steps.configureGitUser(options)`    | Configures local git author settings for the repository. | `name`, `email`.                   |
| `steps.createReleaseBranch(options)` | Creates and switches to a local release branch.          | `branch`.                          |
| `steps.stageFiles(options)`          | Stages files with `git add`.                             | `paths`.                           |
| `steps.commit(options)`              | Commits staged files.                                    | `message`, `skipIfNoChanges`.      |
| `steps.tag(options)`                 | Creates a git tag and deletes it if a later step fails.  | `name`, `message`.                 |
| `steps.push(options)`                | Pushes a branch to a remote.                             | `branch`, `remote`, `setUpstream`. |

**Release Outputs**

| Step                               | Description                                                                             | Options                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `steps.publishNpmPackage(options)` | Publishes a package with `npm publish`.                                                 | `packageName`, `packageDir`, `dryRun`.          |
| `steps.githubRelease(options)`     | Creates a GitHub Release with `gh release create` and deletes it if a later step fails. | `tag`, `title`, `notes`, `draft`, `prerelease`. |
| `steps.updateChangelog(options)`   | Adds a version entry to a changelog and rolls it back if a later step fails.            | `version`, `path`, `date`, `changes`.           |

**Commands**

| Step                                 | Description                                              | Options                                      |
| ------------------------------------ | -------------------------------------------------------- | -------------------------------------------- |
| `steps.runCommand(command, options)` | Runs a shell command from the current working directory. | Same options as the internal command helper. |

Custom steps can be added with `(context) => { ... }`.

CLI arguments can be declared with Zod in config and used when building the flow.

```ts filename=rlse.config.ts
import { defineConfig, presets, z } from "@takuma-ru/rlse";

export default defineConfig({
  args: z.object({
    level: z
      .enum(["patch", "minor", "major", "preup"])
      .default("patch")
      .describe("Release level"),
    pre: z.boolean().default(false).describe("Release as pre-release"),
  }),
  flow: ({ args }) =>
    presets.npmRelease({
      resolvePackage: { name: "vanilla-ts" },
      calculateNextSemver: {
        level: args.level,
        pre: args.pre,
      },
      runCommand: "pnpm build",
    }),
});
```

```shell
rlse --level minor --pre
```

Use `--dry-run` to execute the flow without applying mutations such as writing
versions, staging files, committing, tagging, configuring git, or pushing.

### Multi-package releases

Rlse does not currently provide a coordinated multi-package release planner like
Changesets or Lerna. For now, define one explicit flow per package, or compose
multiple package flows manually when ordering and dependency bumps are simple.
Use Changesets when you need change files, dependency graph updates, or a single
release PR that coordinates many packages.

### Comparison

Rlse focuses on explicit TypeScript release flows made from small steps.

| Tool                 | Best fit                                            | Difference from Rlse                                                                                       |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| One-off `release.ts` | Fully custom project-specific release scripts.      | Rlse keeps the TypeScript control while adding reusable steps, dry-run, rollback hooks, and typed results. |
| `semantic-release`   | Fully automated CI releases from commit history.    | Rlse does not require Conventional Commits and keeps release logic explicit in code.                       |
| `release-it`         | Mature interactive or configured release workflows. | Rlse exposes the release flow as TypeScript steps instead of a broad plugin-driven CLI.                    |
| `changesets`         | Coordinated monorepo package versioning.            | Rlse does not manage changeset files or dependency graph bumps; use it for explicit per-package flows.     |
| `lerna`              | Monorepo versioning and publishing.                 | Rlse is a release workflow runner, not a monorepo package manager.                                         |

### defineConfig Types

```ts
type RlseConfig<TArgs extends z.AnyZodObject = z.AnyZodObject> =
  | RlseFlowStep[]
  | {
      args: TArgs;
      flow: (context: { args: z.infer<TArgs> }) => RlseFlowStep[];
    };

type RlseFlowStep =
  | {
      name: string;
      run: (context: RlseContext) => unknown;
      rollback?: (
        context: RlseContext,
        result: RlseStepResult,
      ) => Promise<void> | void;
    }
  | ((context: RlseContext) => unknown);
```

## License

[Mozilla Public License Version 2.0](https://www.mozilla.org/en-US/MPL/2.0/)
