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
    calculateNextVersion: {
      version: ({ currentVersion, inc }) =>
        inc(currentVersion, "prerelease", "beta")!,
    },
    run: "pnpm build",
  }),
);
```

The release preset is built from small public steps. Use primitives directly when
you need full control over side effects.

```ts filename=rlse.config.ts
import { defineConfig, steps } from "@takuma-ru/rlse";

export default defineConfig([
  steps.resolvePackage({ name: "vanilla-ts" }),
  steps.resolvePublishedVersion(),
  steps.calculateNextVersion({ level: "patch" }),
  steps.writePackageVersion(),
  steps.run("pnpm build"),
  steps.stageFiles(),
  steps.commit(),
  steps.publish(),
  steps.push(),
]);
```

The default npm preset commits before publishing and pushes after publishing. If
`publish` succeeds but `push` fails, rerun after fixing git access or push the
created commit manually.

### Available steps

The following steps are exported from `steps`.

| Step | Description | Options |
| --- | --- | --- |
| `steps.resolvePackage({ name })` | Finds the target `package.json` by package name and stores package metadata in the flow context. | `name`: package name. |
| `steps.resolvePublishedVersion()` | Reads the currently published npm version for the resolved package. Falls back to the local package version or `0.0.0`. | None. |
| `steps.calculateNextVersion(options)` | Calculates the next semver version and stores it in the flow context. | `level`, `pre`, `version`. |
| `steps.writePackageVersion()` | Writes the calculated version to the resolved `package.json`. Rolls back the file if the flow fails before commit or publish. | None. |
| `steps.bumpVersion(options)` | Updates the resolved `package.json` version immediately and stores version metadata in the flow context. | `level`, `pre`, `version`. |
| `steps.run(command)` | Runs a shell command from the current working directory. | `command`: command string. |
| `steps.configureGit(options)` | Configures local git author settings for the repository. | `name`, `email`. |
| `steps.createReleaseBranch(options)` | Creates and pushes a release branch, then stores the base and release branch names in the flow context. | `name`: branch name or resolver. |
| `steps.stageFiles(options)` | Stages files with `git add`. Defaults to the resolved `package.json`. | `paths`: files to stage. |
| `steps.commit(options)` | Commits staged files when there are changes. Defaults to a release commit message when package/version are available. | `message`: string or resolver. |
| `steps.commitChanges(options)` | Stages the resolved `package.json`, commits it, and pushes to the current release/base branch. | `message`: string or resolver. |
| `steps.publish(options)` | Publishes the resolved package with `pnpm publish --filter <package> --no-git-checks`. | `dryRun`. |
| `steps.push(options)` | Pushes the current release/base/current branch to origin. | `branch`, `setUpstream`. |

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
      calculateNextVersion: {
        level: args.level,
        pre: args.pre,
      },
      run: "pnpm build",
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
      run: (context: RlseContext) => Promise<void> | void;
      rollback?: (context: RlseContext) => Promise<void> | void;
    }
  | ((context: RlseContext) => Promise<void> | void);
```

## License

[Mozilla Public License Version 2.0](https://www.mozilla.org/en-US/MPL/2.0/)
