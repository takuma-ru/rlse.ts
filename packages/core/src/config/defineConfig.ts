import type {
  RlseArgsSchema,
  RlseConfig,
  RlseConfigWithArgs,
} from "../types/RlseConfig";

export function defineConfig<const TFlow extends RlseConfig>(
  config: TFlow,
): TFlow;
export function defineConfig<const TArgs extends RlseArgsSchema>(
  config: RlseConfigWithArgs<TArgs>,
): RlseConfigWithArgs<TArgs>;
export function defineConfig(config: RlseConfig) {
  return config;
}
