import { Command, Option } from "commander";

import packageJson from "../package.json";
import { releaseAction } from "./action/releaseAction";
import { loadRlseConfig } from "./config/loadRlseConfig";
import type { RlseArgDefinition, RlseConfig } from "./types/RlseConfig";

const program = new Command();

const thisPackageVersion = packageJson.version as string;

const main = async () => {
  const config = await loadRlseConfig();

  program
    .name("rlse")
    .description("Release npm package")
    .version(thisPackageVersion);

  for (const [name, definition] of Object.entries(getArgDefinitions(config))) {
    program.addOption(createOption(name, definition));
  }

  program.action(async (args) => {
    releaseAction(config, args);
  });

  program.parse();
};

const getArgDefinitions = (config: RlseConfig) => {
  if (Array.isArray(config)) {
    return {};
  }

  return config.args;
};

const createOption = (name: string, definition: RlseArgDefinition) => {
  const option = new Option(
    createFlags(name, definition),
    definition.description,
  );

  if (definition.type === "string" && definition.choices) {
    option.choices([...definition.choices]);
  }

  if (definition.default !== undefined) {
    option.default(definition.default);
  }

  return option;
};

const createFlags = (name: string, definition: RlseArgDefinition) => {
  const longName = toKebabCase(name);
  const longFlag = `--${longName}${definition.type === "string" ? ` <${name}>` : ""}`;

  if (!definition.short) {
    return longFlag;
  }

  return `-${definition.short}, ${longFlag}`;
};

const toKebabCase = (value: string) => {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
};

void main();
