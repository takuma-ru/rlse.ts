import { Command } from "commander";

import packageJson from "../package.json";
import { releaseAction } from "./action/releaseAction";
import { loadRlseConfig } from "./config/loadRlseConfig";

const program = new Command();

const thisPackageVersion = packageJson.version as string;

program
  .name("rlse")
  .description("Release npm package")
  .version(thisPackageVersion)
  .action(async () => {
    const optionFromFile = await loadRlseConfig();
    releaseAction(optionFromFile);
  });

program.parse();
