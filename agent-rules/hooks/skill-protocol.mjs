// Claude Code hook for UserPromptSubmit and PostToolUse on Skill.
// Adds the protocols of the skills active in the session to the agent's context.
// Protocols come from every `.agent-rules/skills/` from the session's cwd up to `/`; the nearest wins per skill.
// An extension skill, `skills/<name>-ext/SKILL.md` in dev-skills, is added whole when a protocol names it in `with:`.
//   echo '<hook event JSON>' | node skill-protocol.mjs
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MARKER = /^<!--[^\n]*-->\n/;
const COMMAND = /^<command-message>[^<]*<\/command-message>\s*<command-name>\/([\w:.-]+)<\/command-name>/;
const TYPED = /^\s*\/([\w:.-]+)/;

export const short = (name) => name.split(":").pop() ?? name;

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
  const companions = (meta.get("with") ?? "").replace(/^\[|\]$/g, "").split(",").map((c) => c.trim()).filter(Boolean);
  return [meta.get("skill") ?? basename(file, ".md"), {
    sideQuest: meta.get("kind") === "side-quest",
    with: companions,
    body: body.trim(),
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
  for (const companion of protocols.get(name)?.with ?? []) expand(companion, protocols, seen);
  return seen;
}
const isSideQuest = (name, protocols) => protocols.get(name)?.sideQuest === true;

function applyUserCommand(name, active, protocols) {
  return isSideQuest(name, protocols) ? active : expand(name, protocols);
}

function applySkillCall(name, active, protocols) {
  if (isSideQuest(name, protocols)) return active;
  return [...active, ...expand(name, protocols).filter((n) => !active.includes(n))];
}

export function activeFromTranscript(transcript, protocols) {
  let active = [];
  for (const line of transcript.split("\n")) {
    if (!line.includes("command-name") && !line.includes('"Skill"')) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const content = entry.message?.content;
    if (entry.type === "user" && typeof content === "string") {
      const match = COMMAND.exec(content);
      if (match) active = applyUserCommand(short(match[1]), active, protocols);
    } else if (entry.type === "assistant" && Array.isArray(content)) {
      for (const block of content) {
        const skill = block.type === "tool_use" && block.name === "Skill" ? block.input?.skill : undefined;
        if (skill) active = applySkillCall(short(skill), active, protocols);
      }
    }
  }
  return active;
}

function render(names, protocols, reason) {
  const known = [...new Set(names)].filter((n) => protocols.has(n));
  if (known.length === 0) return undefined;
  const parts = [`Skill protocols in force (${reason}). Each one binds its own skill only.`];
  for (const name of known) parts.push(`--- ${name} (${protocols.get(name).path}) ---\n${protocols.get(name).body}`);
  return parts.join("\n\n");
}

export function contextFor(event, protocols, transcript) {
  if (event.hook_event_name === "UserPromptSubmit") {
    let active = activeFromTranscript(transcript, protocols);
    let thisTurn = [];
    const prompt = event.prompt ?? "";
    const match = COMMAND.exec(prompt) ?? TYPED.exec(prompt);
    if (match) {
      const name = short(match[1]);
      if (isSideQuest(name, protocols)) thisTurn = expand(name, protocols);
      else active = applyUserCommand(name, active, protocols);
    }
    return render([...active, ...thisTurn], protocols, "skills active in this session");
  }
  if (event.hook_event_name === "PostToolUse" && event.tool_name === "Skill") {
    const name = short(event.tool_input?.skill ?? "");
    return render(expand(name, protocols), protocols, `just invoked: ${name}`);
  }
  return undefined;
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
