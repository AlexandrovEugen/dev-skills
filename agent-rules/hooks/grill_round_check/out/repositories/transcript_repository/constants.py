from typing import Final

GRILL_SKILLS: Final[frozenset[str]] = frozenset(
    {"mattpocock-skills:grilling", "mattpocock-skills:grill-with-docs", "grilling", "grill-with-docs"}
)
GRILL_COMMANDS: Final[tuple[str, ...]] = (
    "<command-name>/mattpocock-skills:grilling</command-name>",
    "<command-name>/mattpocock-skills:grill-with-docs</command-name>",
)
GRILL_ENDS: Final[tuple[str, ...]] = tuple(
    f"<command-name>/mattpocock-skills:{skill}</command-name>"
    for skill in ("to-spec", "to-tickets", "implement", "implement-spec", "tdd", "retro")
)
USER: Final[str] = "user"
ASSISTANT: Final[str] = "assistant"
TEXT: Final[str] = "text"
TOOL_USE: Final[str] = "tool_use"
SKILL_TOOL: Final[str] = "Skill"
