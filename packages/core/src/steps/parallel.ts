import consola from "consola";
import type {
  RlseContext,
  RlseParallelResult,
  RlseStep,
  RlseStepResult,
} from "../flow/types";

export type ParallelTask = {
  name: string;
  run: (context: RlseContext) => unknown;
  rollback?: (
    context: RlseContext,
    result: RlseStepResult,
  ) => Promise<void> | void;
};

export const parallel = (options: {
  name: string;
  concurrency?: number;
  tasks: ParallelTask[];
}): RlseStep => ({
  name: options.name,
  run: async (context) => {
    const concurrency = resolveConcurrency(
      options.concurrency,
      options.tasks.length,
    );
    validateTaskNames(options.tasks);

    consola.start(
      `Parallel step ${options.name} started (${options.tasks.length} tasks, concurrency ${concurrency})`,
    );

    if (context.dryRun) {
      const result = createParallelResult(options.tasks, concurrency, true);

      for (const task of options.tasks) {
        result.tasks[task.name] = {
          name: task.name,
          status: "skipped",
        };
        result.skippedTaskNames.push(task.name);
        consola.info(`[dry-run] Skip parallel task ${task.name}`);
      }

      consola.success(`Parallel step ${options.name} skipped`);
      return result;
    }

    const result = createParallelResult(options.tasks, concurrency, false);
    const completedTasks: { task: ParallelTask; result: RlseStepResult }[] = [];
    const taskFailures: { name: string; error: unknown }[] = [];
    let nextTaskIndex = 0;
    let stopStartingTasks = false;

    const runNextTask = async (): Promise<void> => {
      while (!stopStartingTasks) {
        const task = options.tasks[nextTaskIndex];
        nextTaskIndex += 1;

        if (!task) {
          return;
        }

        consola.start(`[${task.name}] started`);

        try {
          const value = await task.run(context);
          const taskResult = { step: task.name, value };
          result.tasks[task.name] = {
            name: task.name,
            status: "succeeded",
            value,
          };
          result.succeededTaskNames.push(task.name);
          completedTasks.push({ task, result: taskResult });
          consola.success(`[${task.name}] succeeded`);
        } catch (error) {
          stopStartingTasks = true;
          taskFailures.push({ name: task.name, error });
          result.tasks[task.name] = {
            name: task.name,
            status: "failed",
            error,
          };
          result.failedTaskNames.push(task.name);
          consola.error(`[${task.name}] failed`);
        }
      }
    };

    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        await runNextTask();
      }),
    );

    if (taskFailures.length > 0) {
      result.ok = false;
      const rollbackFailures = await rollbackCompletedTasks(
        context,
        completedTasks,
      );
      throw createParallelError(options.name, taskFailures, rollbackFailures);
    }

    consola.success(`Parallel step ${options.name} completed`);
    return result;
  },
});

const createParallelResult = (
  tasks: ParallelTask[],
  concurrency: number,
  dryRun: boolean,
): RlseParallelResult => ({
  ok: true,
  dryRun,
  concurrency,
  taskCount: tasks.length,
  tasks: {},
  succeededTaskNames: [],
  failedTaskNames: [],
  skippedTaskNames: [],
});

const resolveConcurrency = (
  concurrency: number | undefined,
  taskCount: number,
) => {
  const resolvedConcurrency = concurrency ?? Math.max(taskCount, 1);

  if (!Number.isInteger(resolvedConcurrency) || resolvedConcurrency < 1) {
    throw new Error("Parallel step concurrency must be a positive integer");
  }

  return Math.min(resolvedConcurrency, Math.max(taskCount, 1));
};

const validateTaskNames = (tasks: ParallelTask[]) => {
  const names = new Set<string>();

  for (const task of tasks) {
    if (names.has(task.name)) {
      throw new Error(`Parallel task names must be unique: ${task.name}`);
    }

    names.add(task.name);
  }
};

const rollbackCompletedTasks = async (
  context: RlseContext,
  completedTasks: { task: ParallelTask; result: RlseStepResult }[],
) => {
  const rollbackFailures: { name: string; error: unknown }[] = [];

  for (const { task, result } of completedTasks.reverse()) {
    if (!task.rollback) {
      continue;
    }

    try {
      consola.start(`[${task.name}] rollback started`);
      await task.rollback(context, result);
      consola.success(`[${task.name}] rollback succeeded`);
    } catch (error) {
      rollbackFailures.push({ name: task.name, error });
      consola.error(`[${task.name}] rollback failed`);
    }
  }

  return rollbackFailures;
};

const createParallelError = (
  stepName: string,
  taskFailures: { name: string; error: unknown }[],
  rollbackFailures: { name: string; error: unknown }[],
) => {
  const errors = [
    ...taskFailures.map(({ error }) => error),
    ...rollbackFailures.map(({ error }) => error),
  ];
  const taskNames = taskFailures.map(({ name }) => name).join(", ");
  const rollbackNames = rollbackFailures.map(({ name }) => name).join(", ");
  const rollbackMessage = rollbackNames
    ? `; rollback failed for: ${rollbackNames}`
    : "";

  return new AggregateError(
    errors,
    `Parallel step ${stepName} failed for: ${taskNames}${rollbackMessage}`,
  );
};
