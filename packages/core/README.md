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
