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

const commitAll = (projectDir) => {
  execSync("git add .", {
    cwd: projectDir,
    stdio: "pipe",
  });
  execSync(
    "git -c user.name=rlse-test -c user.email=rlse@example.com commit -m init",
    {
      cwd: projectDir,
      stdio: "pipe",
    },
  );
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

test("finds latest flow step result value", async () => {
  const { runFlow } = await import(publicApiPath);

  const context = await runFlow([
    {
      name: "package",
      run: () => ({ packageName: "first" }),
    },
    {
      name: "package",
      run: () => ({ packageName: "latest" }),
    },
  ]);

  assert.equal(context.results.findStep("package").packageName, "latest");
});

test("throws when flow step result is missing", async () => {
  const { runFlow } = await import(publicApiPath);

  const context = await runFlow([]);

  assert.throws(
    () => context.results.findStep("missing"),
    /missing result was not found/,
  );
});

test("checks for a clean working tree", async () => {
  const projectDir = createTempProject();

  try {
    const { runFlow, steps } = await import(publicApiPath);

    await assert.rejects(
      () =>
        runFlow([steps.checkCleanWorkingTree()], {
          cwd: projectDir,
        }),
      /Working tree is not clean/,
    );

    commitAll(projectDir);

    const context = await runFlow([steps.checkCleanWorkingTree()], {
      cwd: projectDir,
    });

    assert.deepEqual(context.results.findStep("checkCleanWorkingTree"), {
      clean: true,
      allowUntracked: false,
    });
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("does not write package version during dry-run", async () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "rlse.config.mjs"),
      `import { defineConfig, steps } from "${publicApiPath}";

export default defineConfig([
  steps.resolvePackage({ name: "rlse-config-version-fixture" }),
  steps.writePackageVersion({
    packageJsonPath: ({ results }) =>
      results.findStep("resolvePackage").packageJsonPath,
    version: "9.9.9",
  }),
]);\n`,
    );

    execFileSync("node", [cliPath, "--dry-run"], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const packageJson = JSON.parse(
      readFileSync(path.join(projectDir, "package.json"), "utf8"),
    );

    assert.equal(packageJson.version, "1.2.3");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("rolls back created git tags when a later step fails", async () => {
  const projectDir = createTempProject();

  try {
    commitAll(projectDir);

    const { runFlow, steps } = await import(publicApiPath);

    await assert.rejects(
      () =>
        runFlow(
          [
            steps.tag({ name: "v1.2.3" }),
            {
              name: "fail",
              run: () => {
                throw new Error("fail after tag");
              },
            },
          ],
          { cwd: projectDir },
        ),
      /fail after tag/,
    );

    const tags = execFileSync("git", ["tag", "--list", "v1.2.3"], {
      cwd: projectDir,
      encoding: "utf8",
    }).trim();

    assert.equal(tags, "");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("skips github release creation during dry-run", async () => {
  const { runFlow, steps } = await import(publicApiPath);

  const context = await runFlow(
    [
      steps.githubRelease({
        tag: "v1.2.3",
        title: "Release v1.2.3",
        notes: "Test release",
      }),
    ],
    { dryRun: true },
  );

  assert.deepEqual(context.results.findStep("githubRelease"), {
    tag: "v1.2.3",
    title: "Release v1.2.3",
    notes: "Test release",
    draft: false,
    prerelease: false,
    dryRun: true,
    released: false,
  });
});

test("updates changelog and rolls it back when a later step fails", async () => {
  const projectDir = createTempProject();
  const changelogPath = path.join(projectDir, "CHANGELOG.md");

  try {
    writeFileSync(
      changelogPath,
      "# Changelog\n\n## 1.2.3 - 2024-01-01\n\n- Previous.\n",
    );

    const { runFlow, steps } = await import(publicApiPath);

    await assert.rejects(
      () =>
        runFlow(
          [
            steps.updateChangelog({
              version: "1.3.0",
              date: "2024-02-01",
              changes: ["Added release safety checks."],
            }),
            {
              name: "fail",
              run: () => {
                throw new Error("fail after changelog");
              },
            },
          ],
          { cwd: projectDir },
        ),
      /fail after changelog/,
    );

    assert.equal(
      readFileSync(changelogPath, "utf8"),
      "# Changelog\n\n## 1.2.3 - 2024-01-01\n\n- Previous.\n",
    );
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("npm release preset includes publish safety checks by default", async () => {
  const { presets } = await import(publicApiPath);

  const flow = presets.npmRelease({
    resolvePackage: { name: "rlse-config-version-fixture" },
    calculateNextSemver: { version: "1.3.0" },
    commit: false,
    push: false,
  });

  assert.deepEqual(
    flow.map((step) => step.name),
    [
      "resolvePackage",
      "resolvePublishedVersion",
      "calculateNextSemver",
      "writePackageVersion",
      "checkNpmPackageVersionAvailable",
      "publishNpmPackage",
      "verifyPublishedNpmPackage",
    ],
  );
});

test("skips npm publish verification after dry-run publish", async () => {
  const { runFlow, steps } = await import(publicApiPath);

  const context = await runFlow(
    [
      steps.verifyPublishedNpmPackage({
        packageName: "vanilla-ts",
        version: "0.0.1",
      }),
    ],
    {
      results: [
        {
          step: "publishNpmPackage",
          value: {
            packageName: "vanilla-ts",
            published: false,
          },
        },
      ],
    },
  );

  assert.deepEqual(context.results.findStep("verifyPublishedNpmPackage"), {
    packageName: "vanilla-ts",
    version: "0.0.1",
    dryRun: true,
    verified: false,
  });
});
