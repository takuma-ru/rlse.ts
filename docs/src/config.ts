type Config = {
  packageName: string;
  registry: "npm" | "github";
};

export const config = {
  packageName: "release.ts",
  registry: "npm",
} as const satisfies Config;
