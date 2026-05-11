import type {
  RlseContext,
  RlseFlowStep,
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

export const runFlow = async (
  flow: RlseFlowStep[],
  initialContext?: Partial<RlseContext>,
) => {
  const context: RlseContext = {
    cwd: process.cwd(),
    dryRun: false,
    ...initialContext,
    results: [...(initialContext?.results ?? [])],
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
