import { defineConfig, presets, z } from "@takuma-ru/rlse";

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
      calculateNextVersion: { level: args.level },
      run: "pnpm build",
      publish: { dryRun: true },
      commit: false,
      push: false,
    }),
});
