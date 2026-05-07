import consola from "consola";
import { runFlow } from "../flow/runFlow";
import { parseReleaseSchema } from "../validation/validation";

export const releaseAction = async (options: unknown) => {
  const flow = parseReleaseSchema(options);

  try {
    await runFlow(flow);
  } catch (error) {
    consola.error(error);
    process.exit(1);
  }
};
