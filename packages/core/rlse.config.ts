import { defineConfig, steps, z } from "./src/main";

export default defineConfig({
  args: z.object({
    level: z
      .enum(["patch", "minor", "major", "preup"])
      .default("patch")
      .describe("Release level"),
  }),
  flow: ({ args }) => [
    steps.configureGit({
      name: "github-actions[bot]",
      email: "41898282+github-actions[bot]@users.noreply.github.com",
    }),
    steps.resolvePackage({ name: "@takuma-ru/rlse" }),
    steps.bumpVersion({ level: args.level }),
    steps.run("pnpm build"),
    steps.commitChanges(),
    steps.publish(),
  ],
});
