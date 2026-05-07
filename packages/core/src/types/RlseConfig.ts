import type { RlseFlowStep } from "../flow/types";

export type ReleaseLevel = "patch" | "minor" | "major" | "preup";

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

export type RlseConfig = RlseFlowStep[];
