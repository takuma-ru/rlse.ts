# @takuma-ru/rlse

All-in-one release flow execution package.

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

The release preset is built from small public steps. Use primitives directly when
you need full control over side effects.

```ts filename=rlse.config.ts
import { defineConfig, steps } from "@takuma-ru/rlse";

export default defineConfig([
  steps.resolvePackage({ name: "vanilla-ts" }),
  steps.resolvePublishedVersion({
    packageName: ({ results }) =>
      results.findLast(({ step }) => step === "resolvePackage")!.value
        .packageName,
  }),
  steps.calculateNextSemver({
    currentVersion: ({ results }) =>
      results.findLast(({ step }) => step === "resolvePublishedVersion")!.value
        .currentVersion,
    level: "patch",
  }),
  steps.writePackageVersion({
    packageJsonPath: ({ results }) =>
      results.findLast(({ step }) => step === "resolvePackage")!.value
        .packageJsonPath,
    version: ({ results }) =>
      results.findLast(({ step }) => step === "calculateNextSemver")!.value
        .nextVersion,
  }),
  steps.runCommand("pnpm build"),
  steps.stageFiles({
    paths: ({ results }) => [
      results.findLast(({ step }) => step === "resolvePackage")!.value
        .packageJsonPath,
    ],
  }),
  steps.commit({ message: "Release vanilla-ts" }),
  steps.publishNpmPackage({ packageName: "vanilla-ts" }),
  steps.push({ branch: "main" }),
]);
```

The default npm preset commits before publishing and pushes after publishing. If
`publish` succeeds but `push` fails, rerun after fixing git access or push the
created commit manually.

### Available steps

The following steps are exported from `steps`.

| Step                                     | Description                                                                                           | Options                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `steps.resolvePackage({ name })`         | Finds the target `package.json` by package name and stores package metadata in the flow context.      | `name`: package name.                                       |
| `steps.resolvePublishedVersion(options)` | Reads the currently published npm version for a package.                                              | `packageName`, `fallbackVersion`.                           |
| `steps.calculateNextSemver(options)`     | Calculates the next semver version.                                                                   | `currentVersion`, `packageJson`, `level`, `pre`, `version`. |
| `steps.writePackageVersion(options)`     | Writes a version to a `package.json`. Rolls back the file if the flow fails before commit or publish. | `packageJsonPath`, `version`.                               |
| `steps.runCommand(command, options)`     | Runs a shell command from the current working directory.                                              | Same options as the internal command helper.                |
| `steps.configureGitUser(options)`        | Configures local git author settings for the repository.                                              | `name`, `email`.                                            |
| `steps.createReleaseBranch(options)`     | Creates and switches to a local release branch.                                                       | `branch`.                                                   |
| `steps.stageFiles(options)`              | Stages files with `git add`.                                                                          | `paths`.                                                    |
| `steps.commit(options)`                  | Commits staged files.                                                                                 | `message`, `skipIfNoChanges`.                               |
| `steps.publishNpmPackage(options)`       | Publishes a package with `npm publish`.                                                               | `packageName`, `dryRun`.                                    |
| `steps.push(options)`                    | Pushes a branch to a remote.                                                                          | `branch`, `remote`, `setUpstream`.                          |

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
