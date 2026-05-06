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
    "rlse": "rlse -n <name> -l <patch | minor | major | pre> -c <build command>"
  }
}
```

### 3. Run

```shell
npm run rlse
```

## Configure settings via CLI

| Option           | Description                             | Type       | Default |
| ---------------- | --------------------------------------- | ---------- | ------- |
| -n, --name       | Package name                            | `string`   |         |
| -l, --level      | Release level                           | `string`   |         |
| -c, --command    | Build command                           | `string`   |         |
| --pre            | Pre-release                             | `boolean`  | `false` |
| --git-user-name  | git config --local user.name `<name>`   | `string`   |         |
| --git-user-email | git config --local user.email `<email>` | `string`   |         |
| -k               | Skip release step                       | `string[]` | `[]`    |

## Configure settings via Setting file

You can configure it without specifying options in the cli by creating `rlse.config.ts` in the project root.
In addition to ts, the following file formats are supported.

- `rlse.config.ts`
- `rlse.config.js`
  - `rlse.config.mjs`
  - `rlse.config.cjs`
- `rlse.config.json`

### Example

```ts filename=rlse.config.ts
import { defineConfig } from "@takuma-ru/rlse";

export default defineConfig({
  name: "vanilla-ts",
  level: "patch",
  pre: false,
  buildCmd: "pnpm build",
  gitUserName: "github-actions[bot]",
  gitUserEmail: "41898282+github-actions[bot]@users.noreply.github.com",
  dryRun: true,
  skipStep: ["config", "commit-changes", "create-release-branch"],
});
```

You can also generate the next version dynamically in `rlse.config.*`.

```ts filename=rlse.config.ts
import { defineConfig } from "@takuma-ru/rlse";

export default defineConfig({
  name: "vanilla-ts",
  buildCmd: "pnpm build",
  skipStep: ["commit-changes", "create-release-branch", "publish"],
  version: ({ currentVersion, inc }) => inc(currentVersion, "prerelease", "beta")!,
});
```

When `version` is specified, its return value is used as the release version.
`level` becomes optional in that case.

### defineConfig Types

```ts
type RlseConfig = {
  name?: string | undefined;
  pre?: boolean | undefined;
  level?: "patch" | "minor" | "major" | "preup" | undefined;
  buildCmd?: string | undefined;
  dryRun?: boolean | undefined;
  gitUserName?: string | undefined;
  gitUserEmail?: string | undefined;
  version?:
    | string
    | ((context: {
        currentVersion: string;
        packageJson: Record<string, unknown> & {
          name?: string;
          version?: string;
        };
        level?: "patch" | "minor" | "major" | "preup" | undefined;
        pre: boolean;
        inc: typeof import("semver").inc;
      }) => string)
    | undefined;
  skipStep?:
    | (
        | "config"
        | "create-release-branch"
        | "build"
        | "commit-changes"
        | "publish"
      )[]
    | undefined;
};
```

## License

[Mozilla Public License Version 2.0](https://www.mozilla.org/en-US/MPL/2.0/)
