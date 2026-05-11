# Flow Results Design Notes

## Goal

Evaluate replacing implicit context mutation between public steps with explicit
step results collected at the flow level.

## Current Problem

Public steps currently communicate by mutating shared `RlseContext` fields.
For example, `resolvePackage` writes `packageName`, then
`resolvePublishedVersion` reads it implicitly, then `calculateNextVersion` reads
`currentVersion` implicitly.

This makes step dependencies hard to see from the flow definition.

## Proposed Direction

Each step should be able to return a result object. The flow runner appends each
step result to a `results` array in execution order.

Conceptually:

```ts
type RlseStepResult = {
  step: string;
  value: unknown;
};

type RlseContext = {
  cwd: string;
  dryRun: boolean;
  results: RlseStepResult[];
};
```

Then a flow can inspect previous results instead of depending on hidden context
fields.

## Questions To Resolve

- Should each result have a typed `name`/`step` discriminator?
- Should results be plain appended objects, or should the runner also provide a
  helper to get the latest result by step name?
- Should existing context fields stay temporarily for compatibility?
- Should public steps require explicit input arguments instead of reading prior
  results directly?
- How should rollback access prior step outputs?

## API Review Notes

Track each current public `steps` API and decide whether it should remain public,
change shape, or move into a preset/internal helper.

- `steps.resolvePackage({ name })`
  - Keep public.
  - Should return package metadata instead of only mutating context.
- `steps.resolvePublishedVersion()`
  - Keep public.
  - Should accept an explicit package name instead of implicitly requiring
    `resolvePackage` to run first.
  - Result should include whether the version came from the registry or a
    fallback.
- `steps.calculateNextVersion(options)`
  - Keep public, but rename candidate: `steps.calculateNextSemver(...)`.
  - The current behavior is semver-specific, so the API name should make that
    explicit.
  - Should accept `currentVersion` explicitly from a previous result instead of
    reading it from context.
  - Should return `{ currentVersion, nextVersion }` style data.
- `steps.writePackageVersion()`
  - Keep public.
  - API name is good because it clearly communicates a package version file
    write.
  - Should accept `packageJsonPath` and `version` explicitly instead of reading
    `packageJsonPath` and `newVersion` from context.
  - Should return `{ packageJsonPath, previousVersion, version }` style data.
  - Rollback should use the step result instead of storing a `versionReset`
    function on context.
  - Preserve the current safety behavior that skips version reset after commit
    or publish.
- `steps.bumpVersion(options)`
  - Remove from the public API.
  - Do not keep as a compatibility alias in the new flow-results API.
  - It combines semver calculation and package file writing, which should stay
    as separate steps: `calculateNextSemver` and `writePackageVersion`.
  - Its rollback behavior should be covered by `writePackageVersion` instead.
- `steps.run(command)`
  - Keep public, but rename candidate: `steps.runCommand(...)`.
  - Should use the same call shape as the internal `cmd` helper for now:
    `command` plus optional `execOptions`, `successCallback`, and
    `errorCallback`.
  - Keep callback options available initially for parity with `cmd`.
  - Should return command execution data, including at least `{ command,
stdout }`.
  - `cwd` should default to the runner cwd, while still allowing
    `execOptions.cwd` override.
- `steps.configureGit(options)`
  - Keep public, but rename to `steps.configureGitUser(...)`.
  - Current behavior only configures local git user identity, so the new name is
    more accurate than `configureGit`.
  - Require at least one of `name` or `email`; an empty options object should be
    invalid.
  - Keep using local git config only: `git config --local user.name` and
    `git config --local user.email`.
  - Should return `{ name, email, scope: "local" }` style data.
- `steps.createReleaseBranch(options)`
  - Keep public, but shrink the behavior.
  - Should only create and switch to the release branch locally.
  - Remove the current automatic remote push/upstream behavior from this step.
  - Remove remote branch deletion from this step's rollback behavior.
  - Use an explicit `branch` option instead of `name`.
  - Should return `{ baseBranch, branch }` style data.
  - Use `steps.push({ branch, setUpstream: true })` when the branch should be
    pushed to origin.
- `steps.stageFiles(options)`
  - Keep public.
  - Require explicit `paths`; remove the current fallback to
    `context.packageJsonPath`.
  - Keep rollback out for now. Unstaging files can accidentally remove user
    staged changes unless the previous index state is tracked precisely.
  - Should return `{ paths }` style data.
- `steps.commit(options)`
  - Keep public.
  - Require an explicit `message`; remove context-based default release message
    generation.
  - Remove `message` resolver functions that receive context.
  - Add an explicit no-changes behavior option, tentatively
    `skipIfNoChanges`.
  - Prefer failing on no staged changes by default for release safety.
  - Should return `{ message, committed, stagedFiles }` style data, plus a
    `reason: "no_changes"` when skipped.
  - Do not add rollback for commits; avoid destructive git reset behavior.
- `steps.commitChanges(options)`
  - Remove from the public API.
  - Do not keep as a compatibility alias in the new flow-results API.
  - It combines staging, committing, and pushing, which should stay as separate
    steps: `stageFiles`, `commit`, and `push`.
  - The current name does not communicate that it pushes to origin.
  - High-level one-shot behavior should live in presets instead.
- `steps.publish(options)`
  - Keep public, but rename to `steps.publishNpmPackage(...)`.
  - Use `npm publish` instead of the current `pnpm publish --filter` command.
  - Should accept `packageName` explicitly instead of reading it from context.
  - Should accept `packageDir` so npm publish runs from the target package
    directory.
  - Remove the implicit `newVersion` requirement; `version` can be optional
    metadata for result/logging if needed.
  - `dryRun` should remain supported, with runner-level dry-run still able to
    provide the default.
  - Should return `{ packageName, packageDir, dryRun, published }` style data.
  - No rollback; publish is not reversible.
- `steps.push(options)`
  - Keep public.
  - Require explicit `branch`; remove fallback to `context.releaseBranch`,
    `context.baseBranch`, or current branch.
  - Remove `branch` resolver functions that receive context.
  - Add `remote` option, defaulting to `origin`.
  - Keep `setUpstream` option.
  - Should return `{ branch, remote, setUpstream }` style data.
  - Do not add rollback for push operations; avoid remote delete or force-push
    behavior.
