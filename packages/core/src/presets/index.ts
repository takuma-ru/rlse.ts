import type { RlseFlowStep } from "../flow/types";
import * as steps from "../steps/index";

type NpmReleaseOptions = {
  configureGit?: Parameters<typeof steps.configureGit>[0];
  resolvePackage: Parameters<typeof steps.resolvePackage>[0];
  calculateNextVersion: Parameters<typeof steps.calculateNextVersion>[0];
  run?: Parameters<typeof steps.run>[0];
  publish?: false | Parameters<typeof steps.publish>[0];
  stageFiles?: false | Parameters<typeof steps.stageFiles>[0];
  commit?: false | Parameters<typeof steps.commit>[0];
  push?: false | Parameters<typeof steps.push>[0];
};

export const npmRelease = (options: NpmReleaseOptions): RlseFlowStep[] => {
  const flow: RlseFlowStep[] = [];

  if (options.configureGit) {
    flow.push(steps.configureGit(options.configureGit));
  }

  flow.push(
    steps.resolvePackage(options.resolvePackage),
    steps.resolvePublishedVersion(),
    steps.calculateNextVersion(options.calculateNextVersion),
    steps.writePackageVersion(),
  );

  if (options.run) {
    flow.push(steps.run(options.run));
  }

  if (options.commit !== false) {
    if (options.stageFiles !== false) {
      flow.push(steps.stageFiles(options.stageFiles));
    }
    flow.push(steps.commit(options.commit));
  }

  if (options.publish !== false) {
    flow.push(steps.publish(options.publish));
  }

  if (options.push !== false) {
    flow.push(steps.push(options.push));
  }

  return flow;
};
