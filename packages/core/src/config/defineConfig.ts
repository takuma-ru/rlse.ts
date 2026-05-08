import type { RlseFlowStep } from "../flow/types";
import type { RlseArgsSchema, RlseConfigWithArgs } from "../types/RlseConfig";

export function defineConfig<const TFlow extends RlseFlowStep[]>(
  config: TFlow,
): TFlow;
export function defineConfig<const TArgs extends RlseArgsSchema>(
  config: RlseConfigWithArgs<TArgs>,
): RlseConfigWithArgs<TArgs>;
export function defineConfig(
  config: RlseFlowStep[] | RlseConfigWithArgs<RlseArgsSchema>,
) {
  return config;
}
