export type RlseContext = {
  cwd: string;
  dryRun: boolean;
  packageJsonPath?: string;
  packageJson?: Record<string, unknown> & {
    name?: string;
    version?: string;
  };
  packageName?: string;
  currentVersion?: string;
  newVersion?: string;
  versionReset?: () => void;
  committed?: boolean;
  published?: boolean;
  baseBranch?: string;
  releaseBranch?: string;
};

export type RlseStepRunner = (context: RlseContext) => Promise<void> | void;

export type RlseStep = {
  name: string;
  run: RlseStepRunner;
  rollback?: RlseStepRunner;
};

export type RlseFlowStep = RlseStep | RlseStepRunner;
