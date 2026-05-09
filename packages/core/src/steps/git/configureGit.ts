import type { RlseStep } from "../../flow/types";
import { cmdFile } from "../../utils/cmd";

export const configureGit = (options?: {
  name?: string;
  email?: string;
}): RlseStep => ({
  name: "configureGit",
  run: () => {
    if (options?.name) {
      cmdFile("git", ["config", "--local", "user.name", options.name]);
    }
    if (options?.email) {
      cmdFile("git", ["config", "--local", "user.email", options.email]);
    }
  },
});
