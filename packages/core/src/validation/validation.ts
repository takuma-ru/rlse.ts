import consola from "consola";
import { z } from "zod";

export const releaseSchema = z.object({
  name: z.string().min(1, {
    message: "Invalid package name",
  }),
  pre: z.boolean().optional().default(false),
  level: z.union(
    [
      z.literal("patch"),
      z.literal("minor"),
      z.literal("major"),
      z.literal("preup"),
      z.literal("fix")
    ],
    {
      message: "Invalid release level",
    },
  ),
  releaseVersion: z.string().optional(),
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
        ],
        {
          message: "Invalid step name",
        },
      ),
    )
    .optional(),
  dryRun: z.boolean().optional().default(false),
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
