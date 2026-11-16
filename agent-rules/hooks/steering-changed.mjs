// Claude Code hook for SessionStart and UserPromptSubmit.
// Tells the agent which steering files changed on disk since its session last checked, so it re-reads them.
// Watched: every file the workspace's steering repo tracks or would track, and the AGENTS.md, CLAUDE.md and
// GLOSSARY.md at the root of each repository up to three folders below the workspace root.
//   echo '<hook event JSON>' | node steering-changed.mjs
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_FILES = ["AGENTS.md", "CLAUDE.md", "GLOSSARY.md"];
const SKIP = new Set(["node_modules", ".worktrees", ".steering.git", ".git"]);

export function steeringRoot(cwd) {
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    if (existsSync(join(dir, ".steering.git"))) return dir;
    if (dirname(dir) === dir) return undefined;
  }
}

function steeringFiles(root) {
  const out = execFileSync("git", ["--git-dir", join(root, ".steering.git"), "--work-tree", root,
    "ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" });
  return out.split("\0").filter(Boolean);
}

function repoFiles(root, dir = root, depth = 0, found = []) {
  if (depth > 3) return found;
  if (dir !== root && existsSync(join(dir, ".git"))) {
    for (const name of REPO_FILES) if (existsSync(join(dir, name))) found.push(join(dir, name).slice(root.length + 1));
    return found;
  }
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP.has(entry.name) && !(entry.name.startsWith(".") && depth === 0 && entry.name !== ".agent-rules")) {
      repoFiles(root, join(dir, entry.name), depth + 1, found);
    }
  }
  return found;
}

export function snapshot(root) {
  const files = [...new Set([...steeringFiles(root), ...repoFiles(root)])].sort();
  return files.flatMap((file) => {
    try {
      return [`${createHash("sha1").update(readFileSync(join(root, file))).digest("hex")} ${file}`];
    } catch {
      return [];
    }
  });
}

export function changedFiles(before, now) {
  const old = new Set(before);
  return [...new Set(now.filter((line) => !old.has(line)).map((line) => line.slice(line.indexOf(" ") + 1)))].sort();
}

export function run(event) {
  const root = event.session_id && steeringRoot(event.cwd ?? process.cwd());
  if (!root) return undefined;
  const stamps = join(root, ".steering.git", "session-stamps");
  mkdirSync(stamps, { recursive: true });
  const stamp = join(stamps, event.session_id.replace(/[^\w-]/g, "_"));
  const now = snapshot(root);
  const before = existsSync(stamp) ? readFileSync(stamp, "utf8").split("\n").filter(Boolean) : undefined;
  writeFileSync(stamp, now.join("\n") + "\n");
  if (!before || event.hook_event_name !== "UserPromptSubmit") return undefined;
  const changed = changedFiles(before, now);
  if (changed.length === 0) return undefined;
  const note = `Steering files changed on disk since this session last checked: ${changed.join(", ")}. Re-read them before relying on the copies already in context.`;
  return { systemMessage: note, hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: note } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const output = run(JSON.parse(readFileSync(0, "utf8") || "{}"));
    if (output) process.stdout.write(JSON.stringify(output));
  } catch {
    process.exitCode = 0;
  }
}
