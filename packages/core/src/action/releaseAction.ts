import consola from "consola";
import { runFlow } from "../flow/runFlow";
import type { RlseConfig } from "../types/RlseConfig";
import { parseFlowSchema, parseReleaseSchema } from "../validation/validation";

export const releaseAction = async (
  options: unknown,
  args: Record<string, string | boolean> = {},
) => {
  try {
    const config = parseReleaseSchema(options);
    const flow = resolveFlow(config, args);
    await runFlow(parseFlowSchema(flow));
  } catch (error) {
    consola.error(error);
    process.exit(1);
  }
};

const resolveFlow = (
  config: RlseConfig,
  args: Record<string, string | boolean>,
) => {
  if (Array.isArray(config)) {
    return config;
  }

  return config.flow({
    args: config.args.parse(args),
  });
};
