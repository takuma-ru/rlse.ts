export type RlseContext = {
  cwd: string;
  dryRun: boolean;
  results: RlseStepResult[];
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
