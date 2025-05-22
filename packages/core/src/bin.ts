import { Command } from "commander";

import packageJson from "../package.json";
import { releaseAction } from "./action/releaseAction";
import { loadRlseConfig } from "./config/loadRlseConfig";

function commaSeparatedList(value: string) {
  return value.split(",");
}

const thisPackageVersion = packageJson.version as string;

const program = new Command();
program
  .name("rlse")
  .description("Release npm package")
  .version(thisPackageVersion)
  .option("-n, --name <name>", "package name")
  .option("--pre", "Release new pre-release")
  .option("-l, --level <patch | minor | major | pre>", "release level")
  .option("-v, --version <version>", "release version")
  .option("-c, --build-cmd <cmd>", "build command")
  .option("--git-user-name <name>", "git config --local user.name <name>")
  .option("--git-user-email <email>", "git config --local user.email <email>")
  .option(
    "-k, --skip-step <<config | create-release-branch | build | commit-changes | publish>...>",
    "Skip release steps (comma separated list!)",
    commaSeparatedList,
    undefined
  )
  .option("--dry-run", "Dry run")
  .action(async (options) => {
    const optionFromFile = await loadRlseConfig();
    const mergedOptions = { ...optionFromFile, ...options };
    releaseAction(mergedOptions);
  });

program.parse();
