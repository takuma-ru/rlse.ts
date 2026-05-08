import { Command, Option } from "commander";
import { z } from "zod";

import packageJson from "../package.json";
import { releaseAction } from "./action/releaseAction";
import { loadRlseConfig } from "./config/loadRlseConfig";
import type { RlseConfig } from "./types/RlseConfig";
import { parseReleaseSchema } from "./validation/validation";

const program = new Command();

const thisPackageVersion = packageJson.version as string;

const main = async () => {
  const config = parseReleaseSchema(await loadRlseConfig());

  program
    .name("rlse")
    .description("Release npm package")
    .version(thisPackageVersion);

  const argSchemas = getArgSchemas(config);

  for (const [name, schema] of Object.entries(argSchemas)) {
    program.addOption(createOption(name, schema));
  }

  program.action(async (args) => {
    await releaseAction(config, args);
  });

  program.parse();
};

const getArgSchemas = (config: RlseConfig) => {
  if (Array.isArray(config)) {
    return {};
  }

  return config.args.shape as Record<string, z.ZodTypeAny>;
};

const createOption = (name: string, schema: z.ZodTypeAny) => {
  const { defaultValue, schema: optionSchema } = unwrapSchema(schema);
  assertSupportedArgSchema(name, optionSchema);
  const option = new Option(
    createFlags(name, optionSchema),
    schema.description,
  );
  const choices = getChoices(optionSchema);

  if (choices) {
    option.choices(choices);
  }

  if (defaultValue !== undefined) {
    option.default(defaultValue);
  }

  return option;
};

const unwrapSchema = (schema: z.ZodTypeAny) => {
  let currentSchema = schema;
  let defaultValue: unknown;

  while (
    currentSchema instanceof z.ZodDefault ||
    currentSchema instanceof z.ZodOptional
  ) {
    if (currentSchema instanceof z.ZodDefault) {
      defaultValue = currentSchema._def.defaultValue();
      currentSchema = currentSchema._def.innerType;
      continue;
    }

    currentSchema = currentSchema._def.innerType;
  }

  return {
    defaultValue,
    schema: currentSchema,
  };
};

const assertSupportedArgSchema = (name: string, schema: z.ZodTypeAny) => {
  if (
    schema instanceof z.ZodString ||
    schema instanceof z.ZodEnum ||
    schema instanceof z.ZodBoolean
  ) {
    return;
  }

  throw new Error(
    `Unsupported CLI argument schema for ${name}. Use z.string(), z.enum(), or z.boolean().`,
  );
};

const getChoices = (schema: z.ZodTypeAny) => {
  if (schema instanceof z.ZodEnum) {
    return [...schema.options];
  }

  return undefined;
};

const createFlags = (name: string, schema: z.ZodTypeAny) => {
  const longName = toKebabCase(name);
  return `--${longName}${schema instanceof z.ZodBoolean ? "" : ` <${name}>`}`;
};

const toKebabCase = (value: string) => {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
};

void main();
