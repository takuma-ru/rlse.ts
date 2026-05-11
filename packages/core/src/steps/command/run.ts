import type { ExecSyncOptionsWithStringEncoding } from "node:child_process";
import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmd } from "../../utils/cmd";

type RunCommandOptions = {
  execOptions?: ExecSyncOptionsWithStringEncoding;
  successCallback?: (stdout: string) => string;
  errorCallback?: (error: NodeJS.ErrnoException) => string;
};

export const runCommand = (
  command: string,
  options?: RunCommandOptions,
): RlseStep => ({
  name: "runCommand",
  run: (context) => {
    const cwd = options?.execOptions?.cwd?.toString() ?? context.cwd;
    const stdout = cmd(command, {
      ...options,
      execOptions: {
        ...options?.execOptions,
        cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        const nextStdout = options?.successCallback?.(stdout) ?? stdout;
        consola.success("Command success");
        return nextStdout;
      },
    });

    return {
      command,
      cwd,
      stdout,
    };
  },
});
