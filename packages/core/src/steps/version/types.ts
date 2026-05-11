import type { ReleaseLevel, VersionResolver } from "../../types/RlseConfig";
import type { PackageJson } from "../package/utils";
import type { Resolvable } from "../resolveOption";

export type VersionOptions = {
  currentVersion: Resolvable<string>;
  packageJson?: Resolvable<PackageJson>;
  level?: ReleaseLevel;
  pre?: boolean;
  version?: string | VersionResolver;
};
