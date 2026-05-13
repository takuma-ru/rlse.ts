type Config = {
  packageName: string;
  registry: "npm" | "github";
};

export const config = {
  packageName: "rlse.ts",
  registry: "npm",
} as const satisfies Config;
