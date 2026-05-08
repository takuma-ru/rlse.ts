import type { RlseContext, RlseFlowStep, RlseStep } from "./types";

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
  };
  const completedSteps: RlseStep[] = [];

  try {
    for (const flowStep of flow) {
      const step = normalizeStep(flowStep);
      await step.run(context);
      completedSteps.push(step);
    }
  } catch (error) {
    for (const step of completedSteps.reverse()) {
      await step.rollback?.(context);
    }

    throw error;
  }

  return context;
};
