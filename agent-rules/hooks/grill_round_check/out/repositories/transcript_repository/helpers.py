from typing import Any

from .constants import ASSISTANT, GRILL_COMMANDS, GRILL_ENDS, GRILL_SKILLS, SKILL_TOOL, TEXT, TOOL_USE, USER


def blocks_of(entry: dict[str, Any]) -> list[dict[str, Any]]:
    content = entry.get("message", {}).get("content", [])
    if isinstance(content, str):
        return [{"type": TEXT, "text": content}]
    return [block for block in content if isinstance(block, dict)]


def text_of(entry: dict[str, Any]) -> str:
    return "\n".join(block.get("text", "") for block in blocks_of(entry) if block.get("type") == TEXT)


def starts_grill(entry: dict[str, Any]) -> bool:
    if entry.get("type") == USER:
        return any(command in text_of(entry) for command in GRILL_COMMANDS)
    if entry.get("type") == ASSISTANT:
        return any(
            block.get("type") == TOOL_USE and block.get("name") == SKILL_TOOL and block.get("input", {}).get("skill") in GRILL_SKILLS
            for block in blocks_of(entry)
        )
    return False


def is_prompt(entry: dict[str, Any]) -> bool:
    return entry.get("type") == USER and not entry.get("isMeta") and text_of(entry).strip() != ""


def is_reply(entry: dict[str, Any]) -> bool:
    return entry.get("type") == ASSISTANT and text_of(entry).strip() != ""


def ends_grill(entry: dict[str, Any]) -> bool:
    return entry.get("type") == USER and any(command in text_of(entry) for command in GRILL_ENDS)
