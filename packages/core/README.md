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
import { defineConfig, steps } from "@takuma-ru/rlse";

export default defineConfig([
  steps.configureGit({
    name: "github-actions[bot]",
    email: "41898282+github-actions[bot]@users.noreply.github.com",
  }),
  steps.resolvePackage({ name: "vanilla-ts" }),
  steps.bumpVersion({
    version: ({ currentVersion, inc }) =>
      inc(currentVersion, "prerelease", "beta")!,
  }),
  steps.createReleaseBranch(),
  steps.run("pnpm build"),
  steps.commitChanges(),
  steps.publish({ dryRun: true }),
]);
```

Custom steps can be added with `(context) => { ... }`.

CLI arguments can be declared in config and used when building the flow.

```ts filename=rlse.config.ts
import { defineConfig, steps } from "@takuma-ru/rlse";

export default defineConfig({
  args: {
    level: {
      type: "string",
      short: "l",
      description: "Release level",
      default: "patch",
      choices: ["patch", "minor", "major", "preup"],
    },
    pre: {
      type: "boolean",
      description: "Release as pre-release",
      default: false,
    },
  },
  flow: ({ args }) => [
    steps.resolvePackage({ name: "vanilla-ts" }),
    steps.bumpVersion({
      level: args.level,
      pre: args.pre,
    }),
    steps.run("pnpm build"),
    steps.commitChanges(),
    steps.publish(),
  ],
});
```

```shell
rlse --level minor --pre
```

### defineConfig Types

```ts
type RlseConfig =
  | RlseFlowStep[]
  | {
      args: Record<string, RlseArgDefinition>;
      flow: (context: { args: Record<string, string | boolean> }) =>
        RlseFlowStep[];
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
