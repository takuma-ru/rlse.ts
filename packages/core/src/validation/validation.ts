import consola from "consola";
import { z } from "zod";
import type { RlseFlowStep } from "../flow/types";
import type { RlseConfig } from "../types/RlseConfig";

const flowStepSchema = z.custom<RlseFlowStep>(
  (value) =>
    typeof value === "function" ||
    (typeof value === "object" &&
      value !== null &&
      "name" in value &&
      "run" in value &&
      typeof value.name === "string" &&
      typeof value.run === "function" &&
      (!("rollback" in value) || typeof value.rollback === "function")),
  {
    message: "Invalid flow step",
  },
);

export const flowSchema = z.array(flowStepSchema).min(1, {
  message: "Release flow must include at least one step",
});

export const releaseSchema = z.union([
  flowSchema,
  z.object({
    args: z.custom<z.AnyZodObject>(
      (value) =>
        typeof value === "object" &&
        value !== null &&
        "shape" in value &&
        "parse" in value &&
        typeof value.parse === "function",
      {
        message: "Invalid args schema",
      },
    ),
    flow: z.custom<
      (context: { args: Record<string, string | boolean> }) => RlseFlowStep[]
    >((value) => typeof value === "function", {
      message: "Invalid flow factory",
    }),
  }),
]);

export const parseReleaseSchema = (options: unknown) => {
  const { data, error } = releaseSchema.safeParse(options);
  if (error) {
    consola.error(error.errors.map((e) => e.message).join("\n"));
    process.exit(1);
  }

  return data as RlseConfig;
};

export const parseFlowSchema = (options: unknown) => {
  const { data, error } = flowSchema.safeParse(options);
  if (error) {
    consola.error(error.errors.map((e) => e.message).join("\n"));
    process.exit(1);
  }

  return data;
};

export type ReleaseSchemaType = z.infer<typeof releaseSchema>;
