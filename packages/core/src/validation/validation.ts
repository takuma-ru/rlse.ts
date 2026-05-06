import consola from "consola";
import { z } from "zod";
import type {
  ReleaseLevel,
  SkipStep,
  VersionResolver,
} from "../types/RlseConfig";

export const releaseSchema = z
  .object({
    name: z.string().min(1, {
      message: "Invalid package name",
    }),
    pre: z.boolean().optional().default(false),
    level: z
      .union(
        [
          z.literal("patch"),
          z.literal("minor"),
          z.literal("major"),
          z.literal("preup"),
        ] satisfies readonly [
          z.ZodType<ReleaseLevel>,
          ...z.ZodType<ReleaseLevel>[],
        ],
        {
          message: "Invalid release level",
        },
      )
      .optional(),
    buildCmd: z.string().min(1, {
      message: "Invalid build command",
    }),
    gitUserName: z.string().optional(),
    gitUserEmail: z.string().optional(),
    skipStep: z
      .array(
        z.union(
          [
            z.literal("config"),
            z.literal("create-release-branch"),
            z.literal("build"),
            z.literal("commit-changes"),
            z.literal("publish"),
          ] satisfies readonly [z.ZodType<SkipStep>, ...z.ZodType<SkipStep>[]],
          {
            message: "Invalid step name",
          },
        ),
      )
      .optional(),
    dryRun: z.boolean().optional().default(false),
    version: z
      .union([
        z.string().min(1, {
          message: "Invalid version",
        }),
        z.custom<VersionResolver>((value) => typeof value === "function", {
          message: "Invalid version generator",
        }),
      ])
      .optional(),
  })
  .superRefine(({ level, version }, ctx) => {
    if (!level && !version) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["level"],
        message: "Release level or version is required",
      });
    }
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
