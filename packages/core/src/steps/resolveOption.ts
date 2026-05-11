import type { RlseContext } from "../flow/types";

export type Resolvable<T> = T | ((context: RlseContext) => T);

export const resolveOption = <T>(
  value: Resolvable<T>,
  context: RlseContext,
) => {
  if (typeof value === "function") {
    return (value as (context: RlseContext) => T)(context);
  }

  return value;
};
