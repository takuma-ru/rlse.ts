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
  findStep<T = Record<string, unknown>>(step: string): T;
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
