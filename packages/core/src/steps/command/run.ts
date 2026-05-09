import consola from "consola";
import type { RlseStep } from "../../flow/types";
import { cmd } from "../../utils/cmd";

export const run = (command: string): RlseStep => ({
  name: "run",
  run: (context) => {
    cmd(command, {
      execOptions: {
        cwd: context.cwd,
        encoding: "utf8",
      },
      successCallback: (stdout) => {
        consola.success("Command success");
        return stdout;
      },
    });
  },
});
