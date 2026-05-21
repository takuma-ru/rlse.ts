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

type RunningTask = {
  task: ParallelTask;
  promise: Promise<TaskOutcome>;
};

type TaskOutcome =
  | {
      runningTask: RunningTask;
      status: "succeeded";
      value: unknown;
    }
  | {
      runningTask: RunningTask;
      status: "failed";
      error: unknown;
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

    const runningTasks = new Set<RunningTask>();

    const startNextTask = () => {
      if (stopStartingTasks) {
        return false;
      }

      const task = options.tasks[nextTaskIndex];

      if (!task) {
        return false;
      }

      nextTaskIndex += 1;
      consola.start(`[${task.name}] started`);

      const runningTask = { task } as RunningTask;
      runningTask.promise = runTask(context, runningTask, () => {
        stopStartingTasks = true;
      });
      runningTasks.add(runningTask);

      return true;
    };

    const fillConcurrency = () => {
      while (runningTasks.size < concurrency) {
        if (!startNextTask()) {
          break;
        }
      }
    };

    fillConcurrency();

    while (runningTasks.size > 0) {
      const outcome = await Promise.race(
        Array.from(runningTasks, ({ promise }) => promise),
      );
      runningTasks.delete(outcome.runningTask);

      if (outcome.status === "succeeded") {
        const taskResult = {
          step: outcome.runningTask.task.name,
          value: outcome.value,
        };
        result.tasks[outcome.runningTask.task.name] = {
          name: outcome.runningTask.task.name,
          status: "succeeded",
          value: outcome.value,
        };
        result.succeededTaskNames.push(outcome.runningTask.task.name);
        completedTasks.push({
          task: outcome.runningTask.task,
          result: taskResult,
        });
        consola.success(`[${outcome.runningTask.task.name}] succeeded`);
        // Let same-turn task failures set stopStartingTasks before filling an open slot.
        await Promise.resolve();
      } else {
        stopStartingTasks = true;
        taskFailures.push({
          name: outcome.runningTask.task.name,
          error: outcome.error,
        });
        result.tasks[outcome.runningTask.task.name] = {
          name: outcome.runningTask.task.name,
          status: "failed",
          error: outcome.error,
        };
        result.failedTaskNames.push(outcome.runningTask.task.name);
        consola.error(`[${outcome.runningTask.task.name}] failed`);
      }

      fillConcurrency();
    }

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

const runTask = async (
  context: RlseContext,
  runningTask: RunningTask,
  onFailure: () => void,
): Promise<TaskOutcome> => {
  try {
    const value = await runningTask.task.run(context);
    return {
      runningTask,
      status: "succeeded",
      value,
    };
  } catch (error) {
    onFailure();

    return {
      runningTask,
      status: "failed",
      error,
    };
  }
};

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
