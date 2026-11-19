import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MARKER = /^<!--[^\n]*-->\n/;
const COMMAND = /^<command-message>[^<]*<\/command-message>\s*<command-name>\/([\w:.-]+)<\/command-name>/;
const TYPED = /^\s*\/([\w:.-]+)/;
const STEP = /^## Step: */m;
const DONE = /^done:\s*(\S+)(?:\s+(\w+)\s*~\s*(.+?))?\s*$/;

export const short = (name) => name.split(":").pop() ?? name;

function parseSteps(body) {
  const parts = body.split(STEP);
  const preamble = parts.shift().trim();
  const steps = parts.map((part) => {
    const [head, criterion = ""] = part.split("\n");
    const done = DONE.exec(criterion.trim());
    return {
      name: head.trim(),
      done: done && { tool: done[1], field: done[2], pattern: done[3] === undefined ? undefined : new RegExp(done[3]) },
      text: `## Step: ${part}`.trim(),
    };
  });
  return { preamble, steps };
}

export function parseProtocol(file, path, text) {
  let body = text.replace(MARKER, "");
  const meta = new Map();
  if (body.startsWith("---\n")) {
    const end = body.indexOf("\n---", 4);
    for (const line of body.slice(4, end).split("\n")) {
      const at = line.indexOf(":");
      if (at > 0) meta.set(line.slice(0, at).trim(), line.slice(at + 1).trim());
    }
    body = body.slice(end + 4);
  }
  const companions = (meta.get("with") ?? "").replace(/^\[|\]$/g, "").split(",").map((c) => c.trim()).filter(Boolean)
    .map((c) => {
      const [name, step] = c.split("@").map((s) => s.trim());
      return { name, step };
    });
  body = body.trim();
  return [meta.get("skill") ?? basename(file, ".md"), {
    sideQuest: meta.get("kind") === "side-quest",
    with: companions,
    body,
    ...parseSteps(body),
    path,
  }];
}

export function protocolDirs(cwd) {
  const dirs = [];
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    const candidate = join(dir, ".agent-rules", "skills");
    if (existsSync(candidate)) dirs.push(candidate);
    if (dirname(dir) === dir) return dirs;
  }
}

export function loadExtensions(skillsDir) {
  const extensions = new Map();
  if (!existsSync(skillsDir)) return extensions;
  for (const dir of readdirSync(skillsDir).filter((d) => d.endsWith("-ext")).sort()) {
    const path = join(skillsDir, dir, "SKILL.md");
    if (!existsSync(path)) continue;
    const [, protocol] = parseProtocol(dir, path, readFileSync(path, "utf8"));
    extensions.set(dir, { ...protocol, sideQuest: false, with: [] });
  }
  return extensions;
}

export function loadProtocols(dirs, extensions = new Map()) {
  const protocols = new Map(extensions);
  for (const dir of [...dirs].reverse()) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
      const path = join(dir, file);
      const [name, protocol] = parseProtocol(file, path, readFileSync(path, "utf8"));
      protocols.set(name, protocol);
    }
  }
  return protocols;
}

function expand(name, protocols, seen = []) {
  if (seen.includes(name)) return seen;
  seen.push(name);
  for (const companion of protocols.get(name)?.with ?? []) expand(companion.name, protocols, seen);
  return seen;
}
const isSideQuest = (name, protocols) => protocols.get(name)?.sideQuest === true;

function startStage(names, state) {
  state.active = names;
  state.start = new Map(names.map((n) => [n, state.calls.length]));
}

function joinStage(names, state) {
  for (const n of names) {
    if (state.active.includes(n)) continue;
    state.active.push(n);
    state.start.set(n, state.calls.length);
  }
}

function applyUserCommand(name, state, protocols) {
  if (!isSideQuest(name, protocols)) startStage(expand(name, protocols), state);
}

function applySkillCall(name, state, protocols) {
  if (!isSideQuest(name, protocols)) joinStage(expand(name, protocols), state);
}

function readTranscript(transcript, protocols) {
  const state = { active: [], start: new Map(), calls: [] };
  for (const line of transcript.split("\n")) {
    if (!line.includes("command-name") && !line.includes("tool_use")) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const content = entry.message?.content;
    if (entry.type === "user" && typeof content === "string") {
      const match = COMMAND.exec(content);
      if (match) applyUserCommand(short(match[1]), state, protocols);
    } else if (entry.type === "assistant" && Array.isArray(content)) {
      for (const block of content.filter((b) => b.type === "tool_use")) {
        state.calls.push({ id: block.id, name: block.name, input: block.input ?? {} });
        const skill = block.name === "Skill" ? block.input?.skill : undefined;
        if (skill) applySkillCall(short(skill), state, protocols);
      }
    }
  }
  return state;
}

export const activeFromTranscript = (transcript, protocols) => readTranscript(transcript, protocols).active;

function meets(call, done) {
  if (call.name !== done.tool) return false;
  if (!done.pattern) return true;
  const value = call.input?.[done.field];
  return done.pattern.test(typeof value === "string" ? value : JSON.stringify(value ?? ""));
}

function currentStep(name, protocols, state) {
  const { steps } = protocols.get(name);
  let from = state.start.get(name) ?? state.calls.length;
  return steps.find((step) => {
    const at = step.done ? state.calls.findIndex((call, i) => i >= from && meets(call, step.done)) : -1;
    from = at + 1;
    return at < 0;
  });
}

function visible(name, names, protocols, state) {
  const ties = names.flatMap((owner) => (protocols.get(owner)?.with ?? []).filter((c) => c.name === name).map((c) => ({ owner, step: c.step })));
  return ties.length === 0 || ties.some(({ owner, step }) => step === undefined || currentStep(owner, protocols, state)?.name === step);
}

function text(name, protocols, state) {
  const protocol = protocols.get(name);
  if (protocol.steps.length === 0) return protocol.body;
  const step = currentStep(name, protocols, state);
  return [protocol.preamble, step?.text].filter(Boolean).join("\n\n");
}

function render(names, protocols, state, reason) {
  const known = [...new Set(names)].filter((n) => protocols.has(n) && visible(n, names, protocols, state));
  if (known.length === 0) return undefined;
  const parts = [`Skill protocols in force (${reason}). Each one binds its own skill only.`];
  for (const name of known) parts.push(`--- ${name} (${protocols.get(name).path}) ---\n${text(name, protocols, state)}`);
  return parts.join("\n\n");
}

function onPrompt(event, protocols, transcript) {
  const state = readTranscript(transcript, protocols);
  const prompt = event.prompt ?? "";
  const match = COMMAND.exec(prompt) ?? TYPED.exec(prompt);
  let names = state.active;
  if (match) {
    const name = short(match[1]);
    if (isSideQuest(name, protocols)) {
      const quest = expand(name, protocols);
      joinStage(quest, state);
      names = [...names, ...quest];
    } else {
      applyUserCommand(name, state, protocols);
      names = state.active;
    }
  }
  return render(names, protocols, state, "skills active in this session");
}

function afterTool(event, protocols, transcript) {
  const state = readTranscript(transcript, protocols);
  const id = event.tool_use_id;
  const before = { ...state, calls: state.calls.filter((c) => id === undefined || c.id !== id) };
  const after = { ...before, calls: [...before.calls, { id, name: event.tool_name, input: event.tool_input ?? {} }] };
  const stepOf = (n, s) => currentStep(n, protocols, s)?.name;
  const advanced = state.active.filter((n) => protocols.has(n) && stepOf(n, before) !== stepOf(n, after));
  const tied = advanced.flatMap((n) => protocols.get(n).with.filter((c) => c.step !== undefined && c.step === stepOf(n, after)).map((c) => c.name));
  if (event.tool_name !== "Skill") return render([...advanced, ...tied], protocols, after, `step done: ${advanced.join(", ")}`);
  const name = short(event.tool_input?.skill ?? "");
  const invoked = expand(name, protocols);
  const start = new Map(after.start);
  for (const n of invoked) start.set(n, after.calls.length);
  const names = [...invoked, ...[...advanced, ...tied].filter((n) => !invoked.includes(n))];
  return render(names, protocols, { ...after, start }, `just invoked: ${name}`);
}

function rendered(event, protocols, transcript) {
  if (event.hook_event_name === "UserPromptSubmit") return onPrompt(event, protocols, transcript);
  if (event.hook_event_name === "PostToolUse") return afterTool(event, protocols, transcript);
  return undefined;
}

export function contextFor(event, protocols, transcript) {
  const context = rendered(event, protocols, transcript);
  return event.transcript_path ? context?.replaceAll("<transcript-path>", event.transcript_path) : context;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const event = JSON.parse(readFileSync(0, "utf8") || "{}");
  const path = event.transcript_path;
  const transcript = path && existsSync(path) ? readFileSync(path, "utf8") : "";
  const extensions = loadExtensions(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "skills"));
  const context = contextFor(event, loadProtocols(protocolDirs(event.cwd ?? process.cwd()), extensions), transcript);
  if (context) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event.hook_event_name, additionalContext: context } }));
  }
}
