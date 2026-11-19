// node --test agent-rules/hooks/skill-protocol.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

function steppedWorkspace() {
  const { root } = workspace();
  writeFileSync(join(root, ".agent-rules", "skills", "to-tickets.md"), [
    "---", "skill: to-tickets", "with: [retro-ext@gather]", "---", "# to-tickets", "", "Run every step in order.", "",
    "## Step: draft", "done: Write file_path ~ tickets\\.md$", "Draft the tickets.", "",
    "## Step: publish", "done: Bash command ~ gh issue create", "Publish each ticket.", "",
    "## Step: gather", "Gather the session.", "",
  ].join("\n"));
  const skills = mkdtempSync(join(tmpdir(), "skills-"));
  mkdirSync(join(skills, "retro-ext"));
  writeFileSync(join(skills, "retro-ext", "SKILL.md"), "---\nname: retro-ext\ndescription: x\n---\n# retro-ext\n\nStart one gathering sub-agent.\n");
  return loadProtocols(protocolDirs(root), loadExtensions(skills));
}

const toolCall = (name, input) => JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] } });
const onPrompt = (protocols, lines) => contextFor({ hook_event_name: "UserPromptSubmit", prompt: "next" }, protocols, lines.join("\n"));
const afterTool = (protocols, lines, tool_name, tool_input) =>
  contextFor({ hook_event_name: "PostToolUse", tool_name, tool_input }, protocols, lines.join("\n"));

test("a prompt injects only the current step of a stepped protocol", () => {
  const out = onPrompt(steppedWorkspace(), [skillCall("to-tickets")]);
  assert.match(out, /Run every step in order\./);
  assert.match(out, /Draft the tickets\./);
  assert.doesNotMatch(out, /Publish each ticket/);
  assert.doesNotMatch(out, /Gather the session/);
  assert.doesNotMatch(out, /gathering sub-agent/);
});

test("a prompt after a step's criterion injects the next step only", () => {
  const out = onPrompt(steppedWorkspace(), [skillCall("to-tickets"), toolCall("Write", { file_path: "docs/tickets.md" })]);
  assert.match(out, /Publish each ticket\./);
  assert.doesNotMatch(out, /Draft the tickets/);
  assert.doesNotMatch(out, /gathering sub-agent/);
});

test("a criterion counts only after its stage started", () => {
  const out = onPrompt(steppedWorkspace(), [toolCall("Write", { file_path: "docs/tickets.md" }), skillCall("to-tickets")]);
  assert.match(out, /Draft the tickets\./);
});

test("a tool call that meets the criterion injects the next step", () => {
  const out = afterTool(steppedWorkspace(), [skillCall("to-tickets")], "Write", { file_path: "docs/tickets.md" });
  assert.match(out, /Publish each ticket\./);
  assert.doesNotMatch(out, /Draft the tickets/);
});

test("a tool call already in the transcript counts once by its id", () => {
  const write = JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "Write", input: { file_path: "a/tickets.md" } }] } });
  const out = contextFor({ hook_event_name: "PostToolUse", tool_name: "Write", tool_use_id: "t1", tool_input: { file_path: "a/tickets.md" } },
    steppedWorkspace(), [skillCall("to-tickets"), write].join("\n"));
  assert.match(out, /Publish each ticket\./);
});

test("a tool call that meets no criterion injects nothing", () => {
  assert.equal(afterTool(steppedWorkspace(), [skillCall("to-tickets")], "Bash", { command: "gh issue create" }), undefined);
  assert.equal(afterTool(steppedWorkspace(), [skillCall("to-tickets")], "Write", { file_path: "notes.md" }), undefined);
});

test("an extension tied to the end step loads only at that step", () => {
  const protocols = steppedWorkspace();
  const drafted = [skillCall("to-tickets"), toolCall("Write", { file_path: "docs/tickets.md" })];
  const atEnd = afterTool(protocols, drafted, "Bash", { command: "gh issue create --title x" });
  assert.match(atEnd, /Gather the session\./);
  assert.match(atEnd, /--- retro-ext .*\n# retro-ext\n\nStart one gathering sub-agent\./);
  const later = onPrompt(protocols, [...drafted, toolCall("Bash", { command: "gh issue create --title x" })]);
  assert.match(later, /Gather the session\./);
  assert.match(later, /Start one gathering sub-agent\./);
  assert.doesNotMatch(later, /Publish each ticket/);
});

test("a Skill call starts its stepped protocol at the first step", () => {
  const out = afterTool(steppedWorkspace(), [], "Skill", { skill: "to-tickets" });
  assert.match(out, /Draft the tickets\./);
  assert.doesNotMatch(out, /Publish each ticket|gathering sub-agent/);
});

test("the PostToolUse matcher covers every tool a criterion names", () => {
  const fragment = JSON.parse(readFileSync(new URL("../platforms/claude-code.json", import.meta.url), "utf8"));
  const matchers = fragment.hooks.PostToolUse.filter((h) => h.hooks.some((c) => c.command.includes("skill-protocol.mjs"))).map((h) => new RegExp(`^(?:${h.matcher})$`));
  const central = new URL("../skill-protocols", import.meta.url).pathname;
  const protocols = loadProtocols([central], loadExtensions(new URL("../../skills", import.meta.url).pathname));
  const tools = new Set(["Skill", ...[...protocols.values()].flatMap((p) => p.steps.map((s) => s.done?.tool)).filter(Boolean)]);
  for (const tool of tools) assert.ok(matchers.some((m) => m.test(tool)), `${tool} is not in the PostToolUse matcher`);
});

function central() {
  return loadProtocols([new URL("../skill-protocols", import.meta.url).pathname], loadExtensions(new URL("../../skills", import.meta.url).pathname));
}

test("the to-tickets protocol injects retro-ext only after its publish criterion", () => {
  const protocols = central();
  const started = afterTool(protocols, [], "Skill", { skill: "mattpocock-skills:to-tickets" });
  assert.match(started, /--- to-tickets /);
  assert.doesNotMatch(started, /--- retro-ext /);
  const drafting = onPrompt(protocols, [skillCall("to-tickets"), toolCall("Bash", { command: "gh issue view 13" })]);
  assert.doesNotMatch(drafting, /--- retro-ext /);
  const published = afterTool(protocols, [skillCall("to-tickets")], "Bash", { command: "gh issue create --title x --body-file b.md" });
  assert.match(published, /--- to-tickets /);
  assert.match(published, /--- retro-ext /);
  assert.match(published, /GATHERING\.md/);
});

test("retro-ext receives the session's transcript path", () => {
  const out = contextFor({ hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: "gh issue create --title x" }, transcript_path: "/s/abc.jsonl" },
    central(), skillCall("to-tickets"));
  assert.match(out, /Transcript: \/s\/abc\.jsonl/);
  assert.doesNotMatch(out, /<transcript-path>/);
});
