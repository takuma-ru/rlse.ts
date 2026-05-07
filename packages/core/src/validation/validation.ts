import consola from "consola";
import { z } from "zod";
import type { RlseFlowStep } from "../flow/types";

const flowStepSchema = z.custom<RlseFlowStep>(
  (value) =>
    typeof value === "function" ||
    (typeof value === "object" &&
      value !== null &&
      "name" in value &&
      "run" in value &&
      typeof value.run === "function"),
  {
    message: "Invalid flow step",
  },
);

export const releaseSchema = z.array(flowStepSchema).min(1, {
  message: "Release flow must include at least one step",
});

export const parseReleaseSchema = (options: unknown) => {
  const { data, error } = releaseSchema.safeParse(options);
  if (error) {
    consola.error(error.errors.map((e) => e.message).join("\n"));
    process.exit(1);
  }

  return data;
};

export type ReleaseSchemaType = z.infer<typeof releaseSchema>;
