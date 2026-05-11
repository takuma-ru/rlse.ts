import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const packageRoot = path.resolve(import.meta.dirname, "..");
const cliPath = path.join(packageRoot, "bin", "bin.js");
const publicApiPath = pathToFileURL(path.join(packageRoot, "dist", "main.js"));

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
      `import { defineConfig, steps } from "${publicApiPath}";

export default defineConfig([
  steps.resolvePackage({ name: "rlse-config-version-fixture" }),
  steps.calculateNextSemver({
    currentVersion: ({ results }) =>
      results.findLast(({ step }) => step === "resolvePackage").value.packageJson
        .version,
    packageJson: ({ results }) =>
      results.findLast(({ step }) => step === "resolvePackage").value.packageJson,
    version: ({ currentVersion, inc }) => inc(currentVersion, "minor"),
  }),
  steps.writePackageVersion({
    packageJsonPath: ({ results }) =>
      results.findLast(({ step }) => step === "resolvePackage").value
        .packageJsonPath,
    version: ({ results }) =>
      results.findLast(({ step }) => step === "calculateNextSemver").value
        .nextVersion,
  }),
]);\n`,
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

test("runs configured flow steps", () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "rlse.config.mjs"),
      `import { defineConfig, steps } from "${publicApiPath}";

export default defineConfig([
  steps.resolvePackage({ name: "rlse-config-version-fixture" }),
  steps.calculateNextSemver({
    currentVersion: ({ results }) =>
      results.findLast(({ step }) => step === "resolvePackage").value.packageJson
        .version,
    version: "2.0.0",
  }),
  steps.writePackageVersion({
    packageJsonPath: ({ results }) =>
      results.findLast(({ step }) => step === "resolvePackage").value
        .packageJsonPath,
    version: ({ results }) =>
      results.findLast(({ step }) => step === "calculateNextSemver").value
        .nextVersion,
  }),
]);\n`,
    );

    execFileSync("node", [cliPath], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const packageJson = JSON.parse(
      readFileSync(path.join(projectDir, "package.json"), "utf8"),
    );

    assert.equal(packageJson.version, "2.0.0");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("uses config-defined cli args in flow", () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "rlse.config.mjs"),
      `import { defineConfig, steps, z } from "${publicApiPath}";

export default defineConfig({
  args: z.object({
    level: z.enum(["patch", "minor"]).default("patch").describe("Release level"),
  }),
  flow: ({ args }) => [
    steps.resolvePackage({ name: "rlse-config-version-fixture" }),
    steps.calculateNextSemver({
      currentVersion: ({ results }) =>
        results.findLast(({ step }) => step === "resolvePackage").value
          .packageJson.version,
      level: args.level,
    }),
    steps.writePackageVersion({
      packageJsonPath: ({ results }) =>
        results.findLast(({ step }) => step === "resolvePackage").value
          .packageJsonPath,
      version: ({ results }) =>
        results.findLast(({ step }) => step === "calculateNextSemver").value
          .nextVersion,
    }),
  ],
});\n`,
    );

    execFileSync("node", [cliPath, "--level", "minor"], {
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

test("uses npm release preset", () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "rlse.config.mjs"),
      `import { defineConfig, presets } from "${publicApiPath}";

export default defineConfig(
  presets.npmRelease({
    resolvePackage: { name: "rlse-config-version-fixture" },
    calculateNextSemver: { version: "3.0.0" },
    publishNpmPackage: false,
    commit: false,
    push: false,
  }),
);\n`,
    );

    execFileSync("node", [cliPath], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const packageJson = JSON.parse(
      readFileSync(path.join(projectDir, "package.json"), "utf8"),
    );

    assert.equal(packageJson.version, "3.0.0");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("collects flow step results", async () => {
  const { runFlow } = await import(publicApiPath);

  const context = await runFlow([
    {
      name: "first",
      run: () => ({ ok: true }),
    },
    {
      name: "second",
      run: ({ results }) => ({ previousStep: results[0].step }),
    },
  ]);

  assert.deepEqual(context.results, [
    { step: "first", value: { ok: true } },
    { step: "second", value: { previousStep: "first" } },
  ]);
});
