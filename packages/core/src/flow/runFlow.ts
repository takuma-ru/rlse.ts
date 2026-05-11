import type {
  RlseContext,
  RlseFlowStep,
  RlseResults,
  RlseStep,
  RlseStepResult,
} from "./types";

const normalizeStep = (step: RlseFlowStep): RlseStep => {
  if (typeof step === "function") {
    return {
      name: step.name || "custom",
      run: step,
    };
  }

  return step;
};

const createResults = (results: RlseStepResult[] = []): RlseResults => {
  Object.defineProperty(results, "findStep", {
    value(step: string) {
      const result = results.findLast((item) => item.step === step);

      if (!result) {
        throw new Error(`${step} result was not found`);
      }

      return result.value;
    },
  });

  return results as RlseResults;
};

type RlseInitialContext = Partial<Omit<RlseContext, "results">> & {
  results?: RlseStepResult[];
};

export const runFlow = async (
  flow: RlseFlowStep[],
  initialContext?: RlseInitialContext,
) => {
  const context: RlseContext = {
    cwd: process.cwd(),
    dryRun: false,
    ...initialContext,
    results: createResults([...(initialContext?.results ?? [])]),
  };
  const completedSteps: { step: RlseStep; result: RlseStepResult }[] = [];

  try {
    for (const flowStep of flow) {
      const step = normalizeStep(flowStep);
      const value = await step.run(context);
      const result = { step: step.name, value };
      context.results.push(result);
      completedSteps.push({ step, result });
    }
  } catch (error) {
    for (const { step, result } of completedSteps.reverse()) {
      await step.rollback?.(context, result);
    }

    throw error;
  }

  return context;
};
