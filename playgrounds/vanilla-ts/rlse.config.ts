import { defineConfig, steps, z } from "@takuma-ru/rlse";

export default defineConfig({
  args: z.object({
    level: z
      .enum(["patch", "minor", "major", "preup"])
      .default("patch")
      .describe("Release level"),
  }),
  flow: ({ args }) => [
    steps.resolvePackage({ name: "vanilla-ts" }),
    steps.bumpVersion({ level: args.level }),
    steps.run("pnpm build"),
    steps.publish({ dryRun: true }),
  ],
});
