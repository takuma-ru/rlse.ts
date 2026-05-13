import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";
import { resolveOption, type Resolvable } from "../resolveOption";

export const verifyPublishedNpmPackage = (options: {
  packageName: Resolvable<string>;
  version: Resolvable<string>;
}): RlseStep => ({
  name: "verifyPublishedNpmPackage",
  run: (context) => {
    const packageName = resolveOption(options.packageName, context);
    const version = resolveOption(options.version, context);

    if (context.dryRun || wasNpmPublishSkipped(context, packageName)) {
      consola.info(`[dry-run] Skip verifying ${packageName}@${version}`);

      return {
        packageName,
        version,
        dryRun: true,
        verified: false,
      };
    }

    const publishedVersion = resolvePublishedVersionWithRetry(
      packageName,
      version,
      context.cwd,
    );

    if (publishedVersion !== version) {
      throw new Error(
        `Expected ${packageName}@${version}, but registry returned ${publishedVersion}`,
      );
    }

    consola.success(`Verified ${packageName}@${version} on npm`);

    return {
      packageName,
      version,
      dryRun: false,
      verified: true,
    };
  },
});

const resolvePublishedVersionWithRetry = (
  packageName: string,
  version: string,
  cwd: string,
) => {
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const publishedVersion = cmdFile(
      "npm",
      ["view", `${packageName}@${version}`, "version"],
      {
        execOptions: {
          cwd,
          stdio: "pipe",
          encoding: "utf8",
        },
        successCallback: (stdout) => stdout.trim(),
        silentError: attempt < maxAttempts,
        errorCallback: (error) => {
          if (attempt === maxAttempts) {
            throw new Error(error.message);
          }

          consola.info(
            `Waiting for ${packageName}@${version} to appear on npm (${attempt}/${maxAttempts})`,
          );
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5_000);

          return "";
        },
      },
    );

    if (publishedVersion) {
      return publishedVersion;
    }
  }

  throw new Error(`Unable to verify ${packageName}@${version} on npm`);
};

const wasNpmPublishSkipped = (
  context: Parameters<RlseStep["run"]>[0],
  packageName: string,
) => {
  return context.results.some(
    ({ step, value }) =>
      step === "publishNpmPackage" &&
      typeof value === "object" &&
      value !== null &&
      "packageName" in value &&
      value.packageName === packageName &&
      "published" in value &&
      value.published === false,
  );
};
