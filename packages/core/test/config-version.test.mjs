import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
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

test("loads TypeScript config", () => {
  const projectDir = createTempProject();

  try {
    mkdirSync(path.join(projectDir, "node_modules"), { recursive: true });
    symlinkSync(packageRoot, path.join(projectDir, "node_modules", "rlse.ts"));

    writeFileSync(
      path.join(projectDir, "rlse.config.ts"),
      `import { defineConfig, presets } from "rlse.ts";

export default defineConfig(
  presets.npmRelease({
    resolvePackage: { name: "rlse-config-version-fixture" },
    calculateNextSemver: { version: "4.0.0" },
    publishNpmPackage: false,
    commit: false,
    push: false,
  }),
);
`,
    );

    execFileSync("node", [cliPath], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const packageJson = JSON.parse(
      readFileSync(path.join(projectDir, "package.json"), "utf8"),
    );

    assert.equal(packageJson.version, "4.0.0");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("loads TypeScript config in ESM project", () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "package.json"),
      JSON.stringify(
        {
          name: "rlse-config-version-fixture",
          version: "1.2.3",
          type: "module",
        },
        null,
        2,
      ),
    );
    mkdirSync(path.join(projectDir, "node_modules"), { recursive: true });
    symlinkSync(packageRoot, path.join(projectDir, "node_modules", "rlse.ts"));

    writeFileSync(
      path.join(projectDir, "rlse.config.ts"),
      `import { defineConfig, presets } from "rlse.ts";

export default defineConfig(
  presets.npmRelease({
    resolvePackage: { name: "rlse-config-version-fixture" },
    calculateNextSemver: { version: "5.0.0" },
    publishNpmPackage: false,
    commit: false,
    push: false,
  }),
);
`,
    );

    execFileSync("node", [cliPath], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const packageJson = JSON.parse(
      readFileSync(path.join(projectDir, "package.json"), "utf8"),
    );

    assert.equal(packageJson.version, "5.0.0");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("loads TypeScript config with extensionless relative import", () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "package.json"),
      JSON.stringify(
        {
          name: "rlse-config-version-fixture",
          version: "1.2.3",
          type: "module",
        },
        null,
        2,
      ),
    );
    mkdirSync(path.join(projectDir, "node_modules"), { recursive: true });
    symlinkSync(packageRoot, path.join(projectDir, "node_modules", "rlse.ts"));

    writeFileSync(
      path.join(projectDir, "release-options.ts"),
      `export const releaseVersion = "6.0.0";
`,
    );
    writeFileSync(
      path.join(projectDir, "rlse.config.ts"),
      `import { defineConfig, presets } from "rlse.ts";
import { releaseVersion } from "./release-options";

export default defineConfig(
  presets.npmRelease({
    resolvePackage: { name: "rlse-config-version-fixture" },
    calculateNextSemver: { version: releaseVersion },
    publishNpmPackage: false,
    commit: false,
    push: false,
  }),
);
`,
    );

    execFileSync("node", [cliPath], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const packageJson = JSON.parse(
      readFileSync(path.join(projectDir, "package.json"), "utf8"),
    );

    assert.equal(packageJson.version, "6.0.0");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("does not load CommonJS config", () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "rlse.config.cjs"),
      `module.exports = [];
`,
    );

    assert.throws(
      () =>
        execFileSync("node", [cliPath], {
          cwd: projectDir,
          stdio: "pipe",
        }),
      /No configuration file found/,
    );
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

test("runs parallel tasks with aggregate results", async () => {
  const { runFlow, steps } = await import(publicApiPath);
  let activeTasks = 0;
  let maxActiveTasks = 0;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const context = await runFlow([
    steps.parallel({
      name: "publishPackages",
      concurrency: 2,
      tasks: ["a", "b", "c"].map((packageName) => ({
        name: `publish:${packageName}`,
        run: async () => {
          activeTasks += 1;
          maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
          await sleep(5);
          activeTasks -= 1;
          return { packageName };
        },
      })),
    }),
  ]);

  assert.equal(maxActiveTasks, 2);
  assert.deepEqual(context.results.findStep("publishPackages"), {
    ok: true,
    dryRun: false,
    concurrency: 2,
    taskCount: 3,
    tasks: {
      "publish:a": {
        name: "publish:a",
        status: "succeeded",
        value: { packageName: "a" },
      },
      "publish:b": {
        name: "publish:b",
        status: "succeeded",
        value: { packageName: "b" },
      },
      "publish:c": {
        name: "publish:c",
        status: "succeeded",
        value: { packageName: "c" },
      },
    },
    succeededTaskNames: ["publish:a", "publish:b", "publish:c"],
    failedTaskNames: [],
    skippedTaskNames: [],
  });
});

test("skips parallel tasks during dry-run", async () => {
  const { runFlow, steps } = await import(publicApiPath);
  let ran = false;

  const context = await runFlow(
    [
      steps.parallel({
        name: "dryRunParallel",
        tasks: [
          {
            name: "task:a",
            run: () => {
              ran = true;
            },
          },
        ],
      }),
    ],
    { dryRun: true },
  );

  assert.equal(ran, false);
  assert.deepEqual(context.results.findStep("dryRunParallel"), {
    ok: true,
    dryRun: true,
    concurrency: 1,
    taskCount: 1,
    tasks: {
      "task:a": {
        name: "task:a",
        status: "skipped",
      },
    },
    succeededTaskNames: [],
    failedTaskNames: [],
    skippedTaskNames: ["task:a"],
  });
});

test("rolls back successful parallel tasks on failure", async () => {
  const { runFlow, steps } = await import(publicApiPath);
  const events = [];

  await assert.rejects(
    () =>
      runFlow([
        steps.parallel({
          name: "parallelFailure",
          concurrency: 1,
          tasks: [
            {
              name: "task:first",
              run: () => {
                events.push("run:first");
                return "first-result";
              },
              rollback: (_, result) => {
                events.push(`rollback:${result.step}:${result.value}`);
              },
            },
            {
              name: "task:second",
              run: () => {
                events.push("run:second");
                throw new Error("second failed");
              },
            },
            {
              name: "task:third",
              run: () => {
                events.push("run:third");
              },
            },
          ],
        }),
      ]),
    /Parallel step parallelFailure failed for: task:second/,
  );

  assert.deepEqual(events, [
    "run:first",
    "run:second",
    "rollback:task:first:first-result",
  ]);
});

test("does not start queued parallel tasks after observing a failure", async () => {
  const { runFlow, steps } = await import(publicApiPath);
  const events = [];

  await assert.rejects(
    () =>
      runFlow([
        steps.parallel({
          name: "parallelFailFast",
          concurrency: 2,
          tasks: [
            {
              name: "task:succeed",
              run: () => {
                events.push("run:succeed");
                return "succeed-result";
              },
              rollback: (_, result) => {
                events.push(`rollback:${result.step}:${result.value}`);
              },
            },
            {
              name: "task:fail",
              run: () => {
                events.push("run:fail");
                return Promise.reject(new Error("fail rejected"));
              },
            },
            {
              name: "task:queued",
              run: () => {
                events.push("run:queued");
              },
            },
          ],
        }),
      ]),
    /Parallel step parallelFailFast failed for: task:fail/,
  );

  assert.deepEqual(events, [
    "run:succeed",
    "run:fail",
    "rollback:task:succeed:succeed-result",
  ]);
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

test("rolls back pushed git tags when a later step fails", async () => {
  const projectDir = createTempProject();
  const remoteDir = mkdtempSync(path.join(tmpdir(), "rlse-remote-"));

  try {
    commitAll(projectDir);
    execFileSync("git", ["init", "--bare", remoteDir], {
      stdio: "pipe",
    });

    const { runFlow, steps } = await import(publicApiPath);

    await assert.rejects(
      () =>
        runFlow(
          [
            steps.tag({ name: "v1.2.3" }),
            steps.pushTag({ tag: "v1.2.3", remote: remoteDir }),
            {
              name: "fail",
              run: () => {
                throw new Error("fail after push tag");
              },
            },
          ],
          { cwd: projectDir },
        ),
      /fail after push tag/,
    );

    const remoteTags = execFileSync(
      "git",
      ["--git-dir", remoteDir, "tag", "--list", "v1.2.3"],
      {
        encoding: "utf8",
      },
    ).trim();
    const localTags = execFileSync("git", ["tag", "--list", "v1.2.3"], {
      cwd: projectDir,
      encoding: "utf8",
    }).trim();

    assert.equal(remoteTags, "");
    assert.equal(localTags, "");
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(remoteDir, { recursive: true, force: true });
  }
});

test("skips pushing git tags during dry-run", async () => {
  const { runFlow, steps } = await import(publicApiPath);

  const context = await runFlow(
    [steps.pushTag({ tag: "v1.2.3", remote: "origin" })],
    { dryRun: true },
  );

  assert.deepEqual(context.results.findStep("pushTag"), {
    tag: "v1.2.3",
    remote: "origin",
    dryRun: true,
    pushed: false,
    skipped: false,
  });
});

test("builds rerunnable release branch names from environment variables", async () => {
  const previousRunId = process.env.GITHUB_RUN_ID;
  const previousRunAttempt = process.env.GITHUB_RUN_ATTEMPT;

  try {
    process.env.GITHUB_RUN_ID = "12345";
    process.env.GITHUB_RUN_ATTEMPT = "2";

    const { runFlow, steps } = await import(publicApiPath);
    const branch = steps.releaseBranchName({
      version: "1.2.3",
      suffix: steps.env(["GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT"]),
    });
    const context = await runFlow([
      {
        name: "branchName",
        run: (rlseContext) => branch(rlseContext),
      },
    ]);

    assert.equal(
      context.results.findStep("branchName"),
      "release/1.2.3-12345-2",
    );
  } finally {
    if (previousRunId === undefined) {
      delete process.env.GITHUB_RUN_ID;
    } else {
      process.env.GITHUB_RUN_ID = previousRunId;
    }

    if (previousRunAttempt === undefined) {
      delete process.env.GITHUB_RUN_ATTEMPT;
    } else {
      process.env.GITHUB_RUN_ATTEMPT = previousRunAttempt;
    }
  }
});

test("respects empty release branch name options", async () => {
  const { runFlow, steps } = await import(publicApiPath);
  const branch = steps.releaseBranchName({
    version: "1.2.3",
    prefix: "",
    suffix: "",
    separator: "",
  });
  const context = await runFlow([
    {
      name: "branchName",
      run: (rlseContext) => branch(rlseContext),
    },
  ]);

  assert.equal(context.results.findStep("branchName"), "1.2.3-");
});

test("skips existing local git tags when requested", async () => {
  const projectDir = createTempProject();

  try {
    commitAll(projectDir);
    execFileSync("git", ["tag", "v1.2.3"], {
      cwd: projectDir,
      stdio: "pipe",
    });
    const tagBefore = execFileSync("git", ["rev-parse", "refs/tags/v1.2.3"], {
      cwd: projectDir,
      encoding: "utf8",
    }).trim();

    const { runFlow, steps } = await import(publicApiPath);
    const context = await runFlow(
      [steps.tag({ name: "v1.2.3", ifExists: "skip" })],
      { cwd: projectDir },
    );
    const tagAfter = execFileSync("git", ["rev-parse", "refs/tags/v1.2.3"], {
      cwd: projectDir,
      encoding: "utf8",
    }).trim();

    assert.deepEqual(context.results.findStep("tag"), {
      name: "v1.2.3",
      message: undefined,
      dryRun: false,
      tagged: false,
      skipped: true,
    });
    assert.equal(tagAfter, tagBefore);
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("restores base branch after skipping an existing release branch", async () => {
  const projectDir = createTempProject();

  try {
    commitAll(projectDir);
    execFileSync("git", ["branch", "release/1.2.3"], {
      cwd: projectDir,
      stdio: "pipe",
    });
    const branchBefore = execFileSync(
      "git",
      ["rev-parse", "refs/heads/release/1.2.3"],
      {
        cwd: projectDir,
        encoding: "utf8",
      },
    ).trim();

    const { runFlow, steps } = await import(publicApiPath);
    await assert.rejects(
      () =>
        runFlow(
          [
            steps.createReleaseBranch({
              branch: "release/1.2.3",
              ifExists: "skip",
            }),
            {
              name: "fail",
              run: () => {
                throw new Error("fail after branch skip");
              },
            },
          ],
          { cwd: projectDir },
        ),
      /fail after branch skip/,
    );

    const currentBranch = execFileSync("git", ["branch", "--show-current"], {
      cwd: projectDir,
      encoding: "utf8",
    }).trim();
    const branchAfter = execFileSync(
      "git",
      ["rev-parse", "refs/heads/release/1.2.3"],
      {
        cwd: projectDir,
        encoding: "utf8",
      },
    ).trim();

    assert.equal(currentBranch, "main");
    assert.equal(branchAfter, branchBefore);
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("skips pushing existing git branches when requested", async () => {
  const projectDir = createTempProject();
  const remoteDir = mkdtempSync(path.join(tmpdir(), "rlse-remote-"));

  try {
    commitAll(projectDir);
    execFileSync("git", ["init", "--bare", remoteDir], {
      stdio: "pipe",
    });
    execFileSync("git", ["push", remoteDir, "main"], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const { runFlow, steps } = await import(publicApiPath);
    const context = await runFlow(
      [steps.push({ branch: "main", remote: remoteDir, ifExists: "skip" })],
      { cwd: projectDir },
    );

    assert.deepEqual(context.results.findStep("push"), {
      branch: "main",
      remote: remoteDir,
      setUpstream: false,
      dryRun: false,
      pushed: false,
      skipped: true,
    });
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(remoteDir, { recursive: true, force: true });
  }
});

test("skips pushing existing git tags when requested", async () => {
  const projectDir = createTempProject();
  const remoteDir = mkdtempSync(path.join(tmpdir(), "rlse-remote-"));

  try {
    commitAll(projectDir);
    execFileSync("git", ["init", "--bare", remoteDir], {
      stdio: "pipe",
    });
    execFileSync("git", ["tag", "v1.2.3"], {
      cwd: projectDir,
      stdio: "pipe",
    });
    execFileSync("git", ["push", remoteDir, "refs/tags/v1.2.3"], {
      cwd: projectDir,
      stdio: "pipe",
    });

    const { runFlow, steps } = await import(publicApiPath);
    const context = await runFlow(
      [steps.pushTag({ tag: "v1.2.3", remote: remoteDir, ifExists: "skip" })],
      { cwd: projectDir },
    );

    assert.deepEqual(context.results.findStep("pushTag"), {
      tag: "v1.2.3",
      remote: remoteDir,
      dryRun: false,
      pushed: false,
      skipped: true,
    });
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(remoteDir, { recursive: true, force: true });
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

test("rejects config args that collide with built-in dry-run", () => {
  const projectDir = createTempProject();

  try {
    writeFileSync(
      path.join(projectDir, "rlse.config.mjs"),
      `import { defineConfig, z } from "${publicApiPath}";

export default defineConfig({
  args: z.object({
    dryRun: z.boolean().default(false),
  }),
  flow: () => [
    {
      name: "noop",
      run: () => undefined,
    },
  ],
});\n`,
    );

    assert.throws(
      () =>
        execFileSync("node", [cliPath], {
          cwd: projectDir,
          stdio: "pipe",
        }),
      /--dry-run is reserved by rlse/,
    );
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("checks npm package version availability without noisy command errors", async () => {
  const { runFlow, steps } = await import(publicApiPath);

  const context = await runFlow([
    steps.checkNpmPackageVersionAvailable({
      packageName: "rlse-config-version-fixture-that-should-not-exist",
      version: "99.99.99",
    }),
  ]);

  assert.deepEqual(
    context.results.findStep("checkNpmPackageVersionAvailable"),
    {
      packageName: "rlse-config-version-fixture-that-should-not-exist",
      version: "99.99.99",
      available: true,
    },
  );
});
