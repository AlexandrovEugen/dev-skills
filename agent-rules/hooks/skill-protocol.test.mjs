// node --test agent-rules/hooks/skill-protocol.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { activeFromTranscript, contextFor, loadProtocols, parseProtocol, protocolDirs } from "./skill-protocol.mjs";

const managed = (name, header, body) =>
  `<!-- managed by dev-skills: agent-rules/skill-protocols/${name}.md -->\n---\n${header}\n---\n# ${name}\n\n${body}\n`;

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "skill-protocol-"));
  const ws = join(root, ".agent-rules", "skills");
  mkdirSync(ws, { recursive: true });
  writeFileSync(join(ws, "grilling.md"), managed("grilling", "skill: grilling\nscope: session", "1. Workspace grilling."));
  writeFileSync(join(ws, "domain-modeling.md"), managed("domain-modeling", "skill: domain-modeling\nscope: session", "1. Glossary."));
  writeFileSync(join(ws, "grill-with-docs.md"),
    managed("grill-with-docs", "skill: grill-with-docs\nscope: session\nwith: [grilling, domain-modeling]", "Call both."));
  writeFileSync(join(ws, "wait-what.md"), "---\nskill: wait-what\nscope: turn\n---\n# wait-what\n\nThis turn only.\n");
  const repo = join(root, "repo");
  mkdirSync(join(repo, ".agent-rules", "skills"), { recursive: true });
  writeFileSync(join(repo, ".agent-rules", "skills", "grilling.md"), "---\nskill: grilling\nscope: session\n---\n1. Repo grilling.\n");
  return { root, repo };
}

const skillCall = (skill) => JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Skill", input: { skill } }] } });
const typed = (name) => JSON.stringify({ type: "user", message: { content: `<command-message>${name}</command-message>\n<command-name>/${name}</command-name>` } });

test("parseProtocol drops the marker and reads the header", () => {
  const [name, p] = parseProtocol("x.md", "x.md", managed("grill-with-docs", "skill: grill-with-docs\nwith: [grilling, domain-modeling]", "Call both."));
  assert.equal(name, "grill-with-docs");
  assert.deepEqual(p.with, ["grilling", "domain-modeling"]);
  assert.equal(p.scope, "session");
  assert.equal(p.body, "# grill-with-docs\n\nCall both.");
});

test("the nearest .agent-rules wins per skill, the rest come from above", () => {
  const { repo } = workspace();
  const protocols = loadProtocols(protocolDirs(repo));
  assert.match(protocols.get("grilling").body, /Repo grilling/);
  assert.ok(protocols.has("domain-modeling"));
});

test("a Skill call injects its protocol and its companions", () => {
  const { root } = workspace();
  const out = contextFor({ hook_event_name: "PostToolUse", tool_name: "Skill", tool_input: { skill: "mattpocock-skills:grill-with-docs" } },
    loadProtocols(protocolDirs(root)), "");
  assert.match(out, /--- grill-with-docs/);
  assert.match(out, /--- grilling/);
  assert.match(out, /--- domain-modeling/);
});

test("every prompt re-injects the session's active skills", () => {
  const { root } = workspace();
  const protocols = loadProtocols(protocolDirs(root));
  const out = contextFor({ hook_event_name: "UserPromptSubmit", prompt: "next" }, protocols, skillCall("grilling"));
  assert.match(out, /Workspace grilling/);
});

test("a typed command replaces the active set; a turn-scoped one adds for this turn only", () => {
  const { root } = workspace();
  const protocols = loadProtocols(protocolDirs(root));
  assert.deepEqual(activeFromTranscript([skillCall("grilling"), typed("domain-modeling")].join("\n"), protocols), ["domain-modeling"]);
  const out = contextFor({ hook_event_name: "UserPromptSubmit", prompt: "/wait-what x" }, protocols, skillCall("grilling"));
  assert.match(out, /--- grilling/);
  assert.match(out, /--- wait-what/);
  assert.deepEqual(activeFromTranscript([skillCall("grilling"), typed("wait-what")].join("\n"), protocols), ["grilling"]);
});

test("no protocol for the skill, no output", () => {
  const { root } = workspace();
  assert.equal(contextFor({ hook_event_name: "PostToolUse", tool_name: "Skill", tool_input: { skill: "tdd" } }, loadProtocols(protocolDirs(root)), ""), undefined);
});
