export type ReleaseLevel = "patch" | "minor" | "major" | "preup";

export type SkipStep =
  | "config"
  | "create-release-branch"
  | "build"
  | "commit-changes"
  | "publish";

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

export type RlseConfig = {
  name?: string;
  pre?: boolean;
  level?: ReleaseLevel;
  buildCmd?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  skipStep?: SkipStep[];
  dryRun?: boolean;
  version?: string | VersionResolver;
};
