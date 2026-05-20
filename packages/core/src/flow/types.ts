import type { PackageJson } from "../steps/package/utils";
import type { ReleaseLevel } from "../types/RlseConfig";

export type RlseContext = {
  cwd: string;
  dryRun: boolean;
  results: RlseResults;
};

export interface RlseResults extends Array<RlseStepResult> {
  findStep<Step extends keyof RlseKnownStepResults>(
    step: Step,
  ): RlseKnownStepResults[Step];
  findStep<T = unknown>(step: string): T;
}

export type RlseKnownStepResults = {
  resolvePackage: {
    packageJsonPath: string;
    packageJson: PackageJson;
    packageName: string;
  };
  resolvePublishedVersion: {
    packageName: string;
    currentVersion: string;
    source: "registry" | "fallback";
  };
  calculateNextSemver: {
    currentVersion: string;
    nextVersion: string;
    level?: ReleaseLevel;
    pre: boolean;
  };
  checkCleanWorkingTree: {
    clean: boolean;
    allowUntracked: boolean;
  };
  tag: {
    name: string;
    message?: string;
    dryRun: boolean;
    tagged: boolean;
  };
  checkGitHubAuth: {
    authenticated: boolean;
  };
  checkAuth: {
    authenticated: boolean;
  };
  checkNpmToken: {
    authenticated: boolean;
    username: string;
  };
  githubRelease: {
    tag: string;
    title: string;
    notes?: string;
    draft: boolean;
    prerelease: boolean;
    dryRun: boolean;
    released: boolean;
  };
  pushTag: {
    tag: string;
    remote: string;
    dryRun: boolean;
    pushed: boolean;
  };
  updateChangelog: {
    path: string;
    version: string;
    date: string;
    changes: string[];
    previousContent?: string;
    dryRun: boolean;
    updated: boolean;
  };
  checkNpmPackageVersionAvailable: {
    packageName: string;
    version: string;
    available: boolean;
  };
  verifyPublishedNpmPackage: {
    packageName: string;
    version: string;
    dryRun: boolean;
    verified: boolean;
  };
};

export type RlseStepResult = {
  step: string;
  value: unknown;
};

export type RlseStepRunner = (context: RlseContext) => unknown;

export type RlseStep = {
  name: string;
  run: RlseStepRunner;
  rollback?: (
    context: RlseContext,
    result: RlseStepResult,
  ) => Promise<void> | void;
};

export type RlseFlowStep = RlseStep | RlseStepRunner;

export type RlseParallelTaskResult = {
  name: string;
  status: "succeeded" | "failed" | "skipped";
  value?: unknown;
  error?: unknown;
};

export type RlseParallelResult = {
  ok: boolean;
  dryRun: boolean;
  concurrency: number;
  taskCount: number;
  tasks: Record<string, RlseParallelTaskResult>;
  succeededTaskNames: string[];
  failedTaskNames: string[];
  skippedTaskNames: string[];
};
