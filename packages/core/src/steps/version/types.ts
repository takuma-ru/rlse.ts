import type { ReleaseLevel, VersionResolver } from "../../types/RlseConfig";

export type VersionOptions = {
  level?: ReleaseLevel;
  pre?: boolean;
  version?: string | VersionResolver;
};
