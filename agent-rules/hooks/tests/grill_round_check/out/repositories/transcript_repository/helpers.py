import json
from pathlib import Path
from typing import Any


def a_prompt(text: str) -> dict[str, Any]:
    return {"type": "user", "message": {"role": "user", "content": text}}


def a_skill_body(text: str) -> dict[str, Any]:
    return {"type": "user", "isMeta": True, "message": {"role": "user", "content": [{"type": "text", "text": text}]}}


def a_reply(text: str) -> dict[str, Any]:
    return {"type": "assistant", "message": {"role": "assistant", "content": [{"type": "text", "text": text}]}}


def a_grill_skill_call() -> dict[str, Any]:
    return {
        "type": "assistant",
        "message": {"role": "assistant", "content": [{"type": "tool_use", "name": "Skill", "input": {"skill": "mattpocock-skills:grilling"}}]},
    }


def a_transcript_with(root: Path, entries: list[dict[str, Any]]) -> Path:
    transcript = root / "session.jsonl"
    transcript.write_text("".join(f"{json.dumps(entry)}\n" for entry in entries))
    return transcript
