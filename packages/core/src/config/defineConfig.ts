import type { RlseConfig } from "../types/RlseConfig";

export const defineConfig = <T extends RlseConfig>(config: T) => {
  return config;
};
