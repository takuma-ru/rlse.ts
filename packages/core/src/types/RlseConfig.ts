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

export type RlseStringArgDefinition = {
  type: "string";
  short?: string;
  description?: string;
  default?: string;
  choices?: readonly string[];
};

export type RlseBooleanArgDefinition = {
  type: "boolean";
  short?: string;
  description?: string;
  default?: boolean;
};

export type RlseArgDefinition =
  | RlseStringArgDefinition
  | RlseBooleanArgDefinition;

export type RlseArgsDefinition = Record<string, RlseArgDefinition>;

export type InferRlseArgs<TArgs extends RlseArgsDefinition> = {
  [Key in keyof TArgs]: TArgs[Key] extends RlseBooleanArgDefinition
    ? boolean
    : TArgs[Key] extends { choices: readonly (infer Choice)[] }
      ? Choice
      : string;
};

export type RlseConfigWithArgs<TArgs extends RlseArgsDefinition> = {
  args: TArgs;
  flow: (context: { args: InferRlseArgs<TArgs> }) => RlseFlowStep[];
};

export type RlseConfig =
  | RlseFlowStep[]
  | RlseConfigWithArgs<RlseArgsDefinition>;
