import {
  type ExecFileSyncOptionsWithStringEncoding,
  type ExecSyncOptionsWithStringEncoding,
  execFileSync,
  execSync,
} from "node:child_process";
import { consola } from "consola";

type CallbackOptions = {
  successCallback?: (stdout: string) => string;
  errorCallback?: (error: NodeJS.ErrnoException) => string;
};

type ShellCmd = (
  command: string,
  options?: {
    execOptions?: ExecSyncOptionsWithStringEncoding;
  } & CallbackOptions,
) => string;

type FileCmd = (
  file: string,
  args?: string[],
  options?: {
    execOptions?: ExecFileSyncOptionsWithStringEncoding;
  } & CallbackOptions,
) => string;

const handleCommandError = (
  error: unknown,
  errorCallback?: (error: NodeJS.ErrnoException) => string,
) => {
  const err = error as NodeJS.ErrnoException;

  consola.error(err.code ?? "", err.message);

  if (errorCallback) {
    return errorCallback(err);
  }

  throw new Error(err.message);
};

export const cmd: ShellCmd = (command, options) => {
  const { execOptions, successCallback, errorCallback } = options ?? {};
  const { stdio = "inherit", encoding = "utf8" } = execOptions ?? {};

  try {
    const stdout = execSync(command, { stdio, encoding, ...execOptions });

    if (successCallback) {
      return successCallback(stdout);
    }

    return stdout;
  } catch (error) {
    return handleCommandError(error, errorCallback);
  }
};

export const cmdFile: FileCmd = (file, args = [], options) => {
  const { execOptions, successCallback, errorCallback } = options ?? {};
  const { stdio = "inherit", encoding = "utf8" } = execOptions ?? {};

  try {
    const stdout = execFileSync(file, args, {
      stdio,
      encoding,
      ...execOptions,
    });

    if (successCallback) {
      return successCallback(stdout);
    }

    return stdout;
  } catch (error) {
    return handleCommandError(error, errorCallback);
  }
};
