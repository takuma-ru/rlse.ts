import type { z } from "zod";
import type { RlseFlowStep } from "../flow/types";

export type ReleaseLevel = "patch" | "minor" | "major" | "preup" | "fix";

export type VersionResolverContext = {
  currentVersion: string;
  packageJson: Record<string, unknown> & {
    name?: string;
    version?: string;
  };
  level?: ReleaseLevel;
  pre: boolean;
  inc: typeof import("semver").inc;
};

export type VersionResolver = (context: VersionResolverContext) => string;

export type RlseArgsSchema = z.AnyZodObject;

export type RlseConfigWithArgs<TArgs extends RlseArgsSchema> = {
  args: TArgs;
  flow: (context: { args: z.infer<TArgs> }) => RlseFlowStep[];
};

export type RlseConfig = RlseFlowStep[] | RlseConfigWithArgs<RlseArgsSchema>;
