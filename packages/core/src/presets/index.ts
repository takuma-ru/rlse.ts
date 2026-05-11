import path from "node:path";
import type { RlseContext, RlseFlowStep } from "../flow/types";
import type { PackageJson } from "../steps/package/utils";
import * as steps from "../steps/index";

type NpmReleaseOptions = {
  configureGitUser?: Parameters<typeof steps.configureGitUser>[0];
  resolvePackage: Parameters<typeof steps.resolvePackage>[0];
  calculateNextSemver: Omit<
    Parameters<typeof steps.calculateNextSemver>[0],
    "currentVersion" | "packageJson"
  >;
  runCommand?: Parameters<typeof steps.runCommand>[0];
  publishNpmPackage?:
    | false
    | Omit<Parameters<typeof steps.publishNpmPackage>[0], "packageName">;
  stageFiles?: false | Omit<Parameters<typeof steps.stageFiles>[0], "paths">;
  commit?: false | Parameters<typeof steps.commit>[0];
  push?: false | Parameters<typeof steps.push>[0];
};

export const npmRelease = (options: NpmReleaseOptions): RlseFlowStep[] => {
  const flow: RlseFlowStep[] = [];

  if (options.configureGitUser) {
    flow.push(steps.configureGitUser(options.configureGitUser));
  }

  flow.push(
    steps.resolvePackage(options.resolvePackage),
    steps.resolvePublishedVersion({
      packageName: (context) => getResolvePackageResult(context).packageName,
      fallbackVersion: (context) =>
        getResolvePackageResult(context).packageJson.version ?? "0.0.0",
    }),
    steps.calculateNextSemver({
      ...options.calculateNextSemver,
      currentVersion: (context) =>
        getResolvePublishedVersionResult(context).currentVersion,
      packageJson: (context) => getResolvePackageResult(context).packageJson,
    }),
    steps.writePackageVersion({
      packageJsonPath: (context) =>
        getResolvePackageResult(context).packageJsonPath,
      version: (context) => getCalculateNextSemverResult(context).nextVersion,
    }),
  );

  if (options.runCommand) {
    flow.push(steps.runCommand(options.runCommand));
  }

  if (options.commit !== false && options.commit) {
    if (options.stageFiles !== false) {
      flow.push(
        steps.stageFiles({
          ...options.stageFiles,
          paths: (context) => [
            getResolvePackageResult(context).packageJsonPath,
          ],
        }),
      );
    }
    flow.push(steps.commit(options.commit));
  }

  if (options.publishNpmPackage !== false) {
    flow.push(
      steps.publishNpmPackage({
        ...options.publishNpmPackage,
        packageName: (context) => getResolvePackageResult(context).packageName,
        packageDir: (context) =>
          path.dirname(getResolvePackageResult(context).packageJsonPath),
      }),
    );
  }

  if (options.push !== false && options.push) {
    flow.push(steps.push(options.push));
  }

  return flow;
};

const getResolvePackageResult = (context: RlseContext) => {
  const result = getLatestResult(context, "resolvePackage");

  if (!isResolvePackageResult(result)) {
    throw new Error("resolvePackage result was not found");
  }

  return result;
};

const getResolvePublishedVersionResult = (context: RlseContext) => {
  const result = getLatestResult(context, "resolvePublishedVersion");

  if (!isResolvePublishedVersionResult(result)) {
    throw new Error("resolvePublishedVersion result was not found");
  }

  return result;
};

const getCalculateNextSemverResult = (context: RlseContext) => {
  const result = getLatestResult(context, "calculateNextSemver");

  if (!isCalculateNextSemverResult(result)) {
    throw new Error("calculateNextSemver result was not found");
  }

  return result;
};

const getLatestResult = (context: RlseContext, step: string) => {
  return context.results.findLast((result) => result.step === step)?.value;
};

const isResolvePackageResult = (
  value: unknown,
): value is {
  packageJsonPath: string;
  packageJson: PackageJson;
  packageName: string;
} =>
  typeof value === "object" &&
  value !== null &&
  "packageJsonPath" in value &&
  typeof value.packageJsonPath === "string" &&
  "packageJson" in value &&
  typeof value.packageJson === "object" &&
  value.packageJson !== null &&
  "packageName" in value &&
  typeof value.packageName === "string";

const isResolvePublishedVersionResult = (
  value: unknown,
): value is { currentVersion: string } =>
  typeof value === "object" &&
  value !== null &&
  "currentVersion" in value &&
  typeof value.currentVersion === "string";

const isCalculateNextSemverResult = (
  value: unknown,
): value is { nextVersion: string } =>
  typeof value === "object" &&
  value !== null &&
  "nextVersion" in value &&
  typeof value.nextVersion === "string";
