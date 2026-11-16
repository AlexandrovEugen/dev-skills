// node --test agent-rules/hooks/steering-changed.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, snapshot, steeringRoot } from "./steering-changed.mjs";

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "steering-"));
  execFileSync("git", ["--git-dir", join(root, ".steering.git"), "--work-tree", root, "init", "-q"]);
  writeFileSync(join(root, ".steering.git", "info", "exclude"), "/*\n!/WORKSPACE.md\n");
  writeFileSync(join(root, "WORKSPACE.md"), "one\n");
  writeFileSync(join(root, "notes.txt"), "not watched\n");
  const repo = join(root, "prod", "api");
  mkdirSync(join(repo, ".git"), { recursive: true });
  writeFileSync(join(repo, "CLAUDE.md"), "repo rules\n");
  return root;
}

const prompt = (root) => ({ session_id: "s1", cwd: join(root, "prod"), hook_event_name: "UserPromptSubmit" });

test("the workspace root is the nearest folder with a steering repo", () => {
  const root = workspace();
  assert.equal(steeringRoot(join(root, "prod", "api")), root);
});

test("watches the steering files and the repositories' agent files only", () => {
  const files = snapshot(workspace()).map((line) => line.split(" ")[1]);
  assert.deepEqual(files, ["WORKSPACE.md", "prod/api/CLAUDE.md"]);
});

test("the first call records; a later prompt names each changed file", () => {
  const root = workspace();
  assert.equal(run(prompt(root)), undefined);
  assert.equal(run(prompt(root)), undefined);
  writeFileSync(join(root, "WORKSPACE.md"), "two\n");
  writeFileSync(join(root, "prod", "api", "CLAUDE.md"), "changed\n");
  writeFileSync(join(root, "notes.txt"), "changed\n");
  const out = run(prompt(root));
  assert.match(out.hookSpecificOutput.additionalContext, /WORKSPACE\.md, prod\/api\/CLAUDE\.md\. Re-read/);
  assert.equal(run(prompt(root)), undefined);
});

test("no steering repo, no output", () => {
  assert.equal(run({ session_id: "s1", cwd: mkdtempSync(join(tmpdir(), "plain-")), hook_event_name: "UserPromptSubmit" }), undefined);
});
