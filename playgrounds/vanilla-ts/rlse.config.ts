import { defineConfig, presets, z } from "rlse.ts";

export default defineConfig({
  args: z.object({
    level: z
      .enum(["patch", "minor", "major", "preup"])
      .default("patch")
      .describe("Release level"),
  }),
  flow: ({ args }) =>
    presets.npmRelease({
      resolvePackage: { name: "vanilla-ts" },
      calculateNextSemver: { level: args.level },
      runCommand: "pnpm build",
      publishNpmPackage: { dryRun: true },
      commit: false,
      push: false,
    }),
});
