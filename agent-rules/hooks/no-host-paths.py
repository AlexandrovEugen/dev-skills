#!/usr/bin/env python3
# Claude Code PreToolUse hook on Write, Edit, MultiEdit, NotebookEdit and Bash.
# Blocks a write, commit, or pull request text in a repository of the workspace that names a place on the dev's machine.
# Extra patterns for one workspace: one regular expression per line in <workspace>/.agent-rules/host-paths.
import json
import os
import re
import subprocess
import sys

BASE_HOST_PATH = r"/Users/|/home/[a-z]|IdeaProjects|/private/tmp/|/tmp/claude-"
WORKSPACE = ""
STEERING = set()
HOST_PATH = re.compile(BASE_HOST_PATH)
GIT_DIR = re.compile(r"\bgit\s+-C\s+['\"]?([^\s'\";&|]+)")
GIT_TIMEOUT_S = 10
GH_WRITE = re.compile(r"\bgh\s+(?:issue|pr)\s+(?:create|comment|edit|review|close)\b|\bgh\s+api\b.*\b(?:body|title)=")
ISSUE_WRITE = re.compile(r"\bgh\s+issue\s+(?:create|comment|edit|close)\b|\bgh\s+api\b[^\n]*\bissues\b")
PR_CALL = re.compile(
    r"\bgh\b\W{0,6}(?:pr\W{1,6}(?:create|comment|edit|review|close)\b"
    r"|api\b[^\n]*\bpulls\b[^\n]*(?:-X|--method|--field|--input|-[fF]\b))"
)
GIT_COMMIT = re.compile(r"\bgit\b[^\n;&|]*\bcommit\b")
FILE_WRITE = re.compile(r"(?:>>?|\btee\b|\bsed\s+-i|\bperl\s+-pi)\s*['\"]?([^\s'\";&|]+)")
FILE_FLAG = re.compile(r"(?:--body-file|-F|--file)\s+['\"]?([^\s'\";&|]+)")
PATH_TOKEN = re.compile(r"(?<![\w.-])[~/][^\s'\";&|()<>]*")
SCRIPT_RUN = re.compile(r"\b(?:python3?|node|bash|sh|zsh|ruby|perl|tsx)\b(?:\s+-\w+)*\s+['\"]?([^\s'\";&|<>]+)")
CD = re.compile(r"\bcd\s+['\"]?([^\s'\";&|]+)")
ASSIGNMENT = re.compile(r"(?<![\w$])([A-Za-z_]\w*)=['\"]?([^\s'\";&|]+)")
VARIABLE = re.compile(r"\$(?:\{(\w+)\}|(\w+))")
IMPORT = re.compile(r"^\s*(?:from|import)\s+([\w.]+)", re.MULTILINE)
NAMED_FILE = re.compile(r"['\"]([\w./-]+\.(?:md|txt|json))['\"]")


def repo_of(path):
    path = os.path.realpath(os.path.expanduser(path))
    if path != WORKSPACE and not path.startswith(WORKSPACE + os.sep):
        return None
    folder = path if os.path.isdir(path) else os.path.dirname(path)
    while folder == WORKSPACE or folder.startswith(WORKSPACE + os.sep):
        if os.path.exists(os.path.join(folder, ".git")):
            if folder in STEERING or folder == WORKSPACE and steering_file(path):
                return None
            return folder
        folder = os.path.dirname(folder)
    return None


def host_paths(text):
    return [match.group(0) for match in HOST_PATH.finditer(text or "")]


def without_existing_paths(command):
    for token in set(PATH_TOKEN.findall(command)):
        if os.path.exists(os.path.expanduser(token.rstrip("/") or "/")):
            command = command.replace(token, "")
    return command


def read(path):
    try:
        with open(os.path.expanduser(path), encoding="utf-8", errors="replace") as handle:
            return handle.read()
    except OSError:
        return ""


def file_tool_offence(tool, given):
    target = given.get("file_path") or given.get("notebook_path") or ""
    if not repo_of(target):
        return None
    if tool == "Write":
        new, old = given.get("content", ""), read(target)
    elif tool == "Edit":
        new, old = given.get("new_string", ""), given.get("old_string", "")
    elif tool == "MultiEdit":
        edits = given.get("edits", [])
        new = "\n".join(edit.get("new_string", "") for edit in edits)
        old = "\n".join(edit.get("old_string", "") for edit in edits)
    else:
        new, old = given.get("new_source", ""), ""
    added = [found for found in host_paths(new) if host_paths(new).count(found) > host_paths(old).count(found)]
    return (added[0], target) if added else None


def expanded(command):
    values = {**os.environ, **dict(ASSIGNMENT.findall(command))}
    return VARIABLE.sub(lambda match: values.get(match.group(1) or match.group(2), match.group(0)), command)


def folders(command, cwd):
    found = [cwd]
    for target in CD.findall(command):
        found.append(os.path.join(found[-1], os.path.expanduser(target)))
    return found


def located(name, places):
    for folder in reversed(places):
        path = os.path.join(folder, os.path.expanduser(name))
        if os.path.isfile(path):
            return path
    return None


def script_texts(code, folder):
    texts = [without_existing_paths(code)]
    for module in IMPORT.findall(code):
        texts.append(without_existing_paths(read(os.path.join(folder, module.replace(".", os.sep) + ".py"))))
    return texts + [read(os.path.join(folder, name)) for name in NAMED_FILE.findall(code)]


def scripts_run(command, cwd):
    places = folders(command, cwd)
    found = []
    for name in SCRIPT_RUN.findall(command):
        path = located(name, places)
        if path and PR_CALL.search(read(path)):
            found += script_texts(read(path), os.path.dirname(path))
    if PR_CALL.search(command):
        found += script_texts(command, places[-1])
    return found


def git_output(folder, *arguments):
    try:
        done = subprocess.run(
            ["git", "-C", folder, *arguments], capture_output=True, text=True, timeout=GIT_TIMEOUT_S, check=False
        )
    except (OSError, subprocess.SubprocessError):
        return ""
    return done.stdout if done.returncode == 0 else ""


def committed_texts(command, cwd):
    places = folders(command, cwd)
    folder = os.path.join(places[-1], os.path.expanduser(GIT_DIR.findall(command)[-1])) if GIT_DIR.search(command) else places[-1]
    top = git_output(folder, "rev-parse", "--show-toplevel").strip()
    if not top or os.path.realpath(top) in STEERING:
        return []
    added = [line[1:] for line in git_output(top, "diff", "HEAD", "--no-color", "-U0").splitlines()
             if line.startswith("+") and not line.startswith("+++")]
    untracked = git_output(top, "ls-files", "--others", "--exclude-standard", "-z").split("\0")
    return ["\n".join(added)] + [read(os.path.join(top, name)) for name in untracked if name]


def bash_offence(command, cwd):
    command = expanded(command)
    writes_repo = any(repo_of(target) for target in FILE_WRITE.findall(command))
    scripts = scripts_run(command, cwd)
    if not (GH_WRITE.search(command) and not ISSUE_WRITE.search(command) or GIT_COMMIT.search(command) or writes_repo or scripts):
        return None
    texts = [without_existing_paths(command)] + scripts
    if GH_WRITE.search(command) or GIT_COMMIT.search(command):
        texts += [read(path) for path in FILE_FLAG.findall(command)]
    for text in texts:
        found = host_paths(text)
        if found:
            return found[0], "the command's text"
    if GIT_COMMIT.search(command):
        for text in committed_texts(command, cwd):
            found = host_paths(text)
            if found:
                return found[0], "the changes this commit takes"
    return None


def steering_file(path):
    relative = os.path.relpath(path, WORKSPACE)
    ignored = subprocess.run(
        ["git", "--git-dir", os.path.join(WORKSPACE, ".steering.git"), "--work-tree", WORKSPACE, "check-ignore", "-q", relative],
        cwd=WORKSPACE, capture_output=True, timeout=GIT_TIMEOUT_S, check=False,
    )
    return ignored.returncode == 1


def workspace_of(cwd):
    folder = os.path.realpath(cwd)
    while True:
        if os.path.isdir(os.path.join(folder, ".steering.git")):
            return folder
        if os.path.dirname(folder) == folder:
            return None
        folder = os.path.dirname(folder)


def configure(cwd):
    global WORKSPACE, STEERING, HOST_PATH
    WORKSPACE = workspace_of(cwd)
    if not WORKSPACE:
        return False
    STEERING = {os.path.join(WORKSPACE, ".claude")}
    extra = [line.strip() for line in read(os.path.join(WORKSPACE, ".agent-rules", "host-paths")).splitlines() if line.strip()]
    HOST_PATH = re.compile("|".join([BASE_HOST_PATH, *extra]))
    return True


def main():
    event = json.load(sys.stdin)
    if not configure(event.get("cwd") or os.getcwd()):
        return
    tool, given = event.get("tool_name", ""), event.get("tool_input", {})
    if tool == "Bash":
        offence = bash_offence(given.get("command", ""), event.get("cwd") or os.getcwd())
    else:
        offence = file_tool_offence(tool, given)
    if offence:
        found, where = offence
        print(
            f"Blocked: '{found}' names a place on the dev's machine, in {where}. "
            "A repo holds only itself: name no path, folder or file on the dev's machine in a repo.",
            file=sys.stderr,
        )
        sys.exit(2)


if __name__ == "__main__":
    main()
