import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const packageRoot = path.resolve(import.meta.dirname, "..");
const cliPath = path.join(packageRoot, "bin", "bin.js");

const createTempProject = () => {
  const projectDir = mkdtempSync(path.join(tmpdir(), "rlse-config-version-"));

  writeFileSync(
    path.join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: "rlse-config-version-fixture",
        version: "1.2.3",
      },
      null,
      2,
    ),
  );

  execSync("git init -b main", {
    cwd: projectDir,
    stdio: "pipe",
  });

  return projectDir;
};

test("uses version generator from rlse config", () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "rlse.config.mjs"),
      `export default {
  name: "rlse-config-version-fixture",
  buildCmd: "true",
  skipStep: ["build", "commit-changes", "publish", "create-release-branch"],
  version: ({ currentVersion, inc }) => inc(currentVersion, "minor"),
};\n`,
    );

    execFileSync("node", [cliPath], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const packageJson = JSON.parse(
      readFileSync(path.join(projectDir, "package.json"), "utf8"),
    );

    assert.equal(packageJson.version, "1.3.0");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});
