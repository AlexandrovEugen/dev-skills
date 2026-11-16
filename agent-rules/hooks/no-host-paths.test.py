# python3 -I agent-rules/hooks/no-host-paths.test.py
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.realpath(__file__))
HOOK = os.path.join(HERE, "no-host-paths.py")


def workspace(root_is_repo=False):
    root = os.path.realpath(tempfile.mkdtemp(prefix="host-paths-"))
    subprocess.run(["git", "--git-dir", f"{root}/.steering.git", "--work-tree", root, "init", "-q"], check=True)
    with open(f"{root}/.steering.git/info/exclude", "w") as f:
        f.write("/*\n!/WORKSPACE.md\n!/.agent-rules/\n")
    os.makedirs(f"{root}/.agent-rules")
    with open(f"{root}/.agent-rules/host-paths", "w") as f:
        f.write(r"(?<![\w.-])meta/rs\b" + "\n")
    repo = root if root_is_repo else f"{root}/api"
    os.makedirs(repo, exist_ok=True)
    subprocess.run(["git", "-C", repo, "init", "-q"], check=True)
    return root, repo


def hook(event):
    done = subprocess.run([sys.executable, "-I", HOOK], input=json.dumps(event), capture_output=True, text=True)
    return done.returncode, done.stderr


def write(root, path, content):
    return hook({"cwd": root, "tool_name": "Write", "tool_input": {"file_path": path, "content": content}})


class NoHostPaths(unittest.TestCase):
    def test_blocks_a_host_path_written_into_a_repo(self):
        root, repo = workspace()
        code, err = write(root, f"{repo}/a.py", "DATA = '/Users/dev/data'\n")
        self.assertEqual(code, 2)
        self.assertIn("/Users/", err)

    def test_blocks_a_workspace_pattern(self):
        root, repo = workspace()
        self.assertEqual(write(root, f"{repo}/a.md", "see meta/rs for inputs\n")[0], 2)

    def test_allows_host_paths_in_workspace_files(self):
        root, _ = workspace()
        self.assertEqual(write(root, f"{root}/WORKSPACE.md", "/Users/dev/notes\n")[0], 0)

    def test_root_repo_keeps_steering_files_out_and_guards_the_rest(self):
        root, repo = workspace(root_is_repo=True)
        self.assertEqual(write(root, f"{root}/WORKSPACE.md", "/Users/dev/notes\n")[0], 0)
        self.assertEqual(write(root, f"{repo}/src/a.py", "P = '/Users/dev'\n")[0], 2)

    def test_silent_outside_a_workspace(self):
        plain = tempfile.mkdtemp(prefix="plain-")
        self.assertEqual(write(plain, f"{plain}/a.py", "/Users/dev\n")[0], 0)


if __name__ == "__main__":
    unittest.main()
