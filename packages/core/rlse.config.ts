import { defineConfig, presets, z } from "./src/main";

export default defineConfig({
  args: z.object({
    level: z
      .enum(["patch", "minor", "major", "preup"])
      .default("patch")
      .describe("Release level"),
  }),
  flow: ({ args }) =>
    presets.npmRelease({
      configureGitUser: {
        name: "github-actions[bot]",
        email: "41898282+github-actions[bot]@users.noreply.github.com",
      },
      resolvePackage: { name: "@takuma-ru/rlse" },
      calculateNextSemver: { level: args.level },
      runCommand: "pnpm build",
    }),
});
