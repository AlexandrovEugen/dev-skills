// node --test agent-rules/hooks/skill-protocol.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { activeFromTranscript, contextFor, loadExtensions, loadProtocols, parseProtocol, protocolDirs } from "./skill-protocol.mjs";

const managed = (name, header, body) =>
  `<!-- managed by dev-skills: agent-rules/skill-protocols/${name}.md -->\n---\n${header}\n---\n# ${name}\n\n${body}\n`;

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "skill-protocol-"));
  const ws = join(root, ".agent-rules", "skills");
  mkdirSync(ws, { recursive: true });
  writeFileSync(join(ws, "grilling.md"), managed("grilling", "skill: grilling\nscope: session\nwith: [grilling-ext]", "1. Workspace grilling."));
  writeFileSync(join(ws, "domain-modeling.md"), managed("domain-modeling", "skill: domain-modeling\nscope: session", "1. Glossary."));
  writeFileSync(join(ws, "grill-with-docs.md"),
    managed("grill-with-docs", "skill: grill-with-docs\nscope: session\nwith: [grilling, domain-modeling]", "Call both."));
  writeFileSync(join(ws, "research.md"), "---\nskill: research\nkind: side-quest\n---\n# research\n\nResearch steps.\n");
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
  assert.equal(p.sideQuest, false);
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

test("a typed side quest keeps the grill's protocols on its prompt and on later prompts", () => {
  const { root } = workspace();
  const protocols = loadProtocols(protocolDirs(root));
  const grill = skillCall("grill-with-docs");
  const onIt = contextFor({ hook_event_name: "UserPromptSubmit", prompt: "/research the hook" }, protocols, grill);
  const later = contextFor({ hook_event_name: "UserPromptSubmit", prompt: "next" }, protocols, [grill, typed("research")].join("\n"));
  for (const out of [onIt, later]) {
    assert.match(out, /--- grill-with-docs/);
    assert.match(out, /Workspace grilling/);
    assert.match(out, /--- domain-modeling/);
  }
  assert.match(onIt, /Research steps\./);
});

test("a typed skill that is not a side quest replaces the grill's protocols", () => {
  const { root } = workspace();
  const protocols = loadProtocols(protocolDirs(root));
  const transcript = [skillCall("grill-with-docs"), typed("research"), typed("domain-modeling")].join("\n");
  const out = contextFor({ hook_event_name: "UserPromptSubmit", prompt: "next" }, protocols, transcript);
  assert.match(out, /--- domain-modeling/);
  assert.doesNotMatch(out, /--- grill-with-docs/);
  assert.doesNotMatch(out, /--- grilling/);
  assert.doesNotMatch(out, /Research steps/);
  const onIt = contextFor({ hook_event_name: "UserPromptSubmit", prompt: "/domain-modeling" }, protocols, skillCall("grill-with-docs"));
  assert.doesNotMatch(onIt, /--- grilling/);
});

test("no protocol for the skill, no output", () => {
  const { root } = workspace();
  assert.equal(contextFor({ hook_event_name: "PostToolUse", tool_name: "Skill", tool_input: { skill: "tdd" } }, loadProtocols(protocolDirs(root)), ""), undefined);
});

test("an extension skill comes whole with its skill, through every level of with", () => {
  const { root } = workspace();
  const skills = mkdtempSync(join(tmpdir(), "skills-"));
  mkdirSync(join(skills, "grilling-ext"));
  writeFileSync(join(skills, "grilling-ext", "SKILL.md"), "---\nname: grilling-ext\ndescription: x\n---\n# grilling-ext\n\nAn Example: line.\n");
  const protocols = loadProtocols(protocolDirs(root), loadExtensions(skills));
  const out = contextFor({ hook_event_name: "PostToolUse", tool_name: "Skill", tool_input: { skill: "grill-with-docs" } }, protocols, "");
  assert.match(out, /--- grilling-ext/);
  assert.match(out, /An Example: line\./);
  assert.doesNotMatch(out, /name: grilling-ext/);
});

test("the real extension skills load from dev-skills", () => {
  const extensions = loadExtensions(new URL("../../skills", import.meta.url).pathname);
  assert.ok(extensions.has("grilling-ext"));
  assert.ok(extensions.has("domain-modeling-ext"));
});

test("the central side quests keep the grill's protocols", () => {
  const central = new URL("../skill-protocols", import.meta.url).pathname;
  const protocols = loadProtocols([central], loadExtensions(new URL("../../skills", import.meta.url).pathname));
  for (const quest of ["wait-what", "research", "prototype"]) {
    const out = contextFor({ hook_event_name: "UserPromptSubmit", prompt: `/${quest} x` }, protocols, skillCall("grill-with-docs"));
    assert.match(out, new RegExp(`--- ${quest} `));
    for (const kept of ["grill-with-docs", "grilling", "grilling-ext", "domain-modeling", "domain-modeling-ext"]) assert.match(out, new RegExp(`--- ${kept} `));
  }
});
