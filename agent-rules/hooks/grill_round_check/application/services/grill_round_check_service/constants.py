import re
from typing import Final

QUESTION_TAG: Final[re.Pattern[str]] = re.compile(r"❓ \*\*Q(\d+)\*\*")
QUESTION_HEAD: Final[re.Pattern[str]] = re.compile(r"^❓ \*\*Q(\d+)\*\*")
TITLED_HEAD: Final[re.Pattern[str]] = re.compile(r"^❓ \*\*Q\d+\*\*(?: \([^)]*\))? - \*\*(.+?)\*\*")
LIST_ITEM: Final[re.Pattern[str]] = re.compile(r"^\s*(?:[-*+]|\d+\.)\s")
BLOCK_END: Final[re.Pattern[str]] = re.compile(r"^(?:---\s*$|\*\*Frontier)")
OPTION: Final[re.Pattern[str]] = re.compile(r"^\s*(?:[-*]\s+)?\*{0,2}\(([a-z])\)")
EXAMPLE: Final[re.Pattern[str]] = re.compile(r"^\s*\*{0,2}Example\b", re.IGNORECASE)
DIGIT: Final[re.Pattern[str]] = re.compile(r"\d")
RECOMMENDATION: Final[re.Pattern[str]] = re.compile(r"^\s*➡️\s*\(([a-z])\)\.?\s*(.*)$")
REWRITTEN: Final[re.Pattern[str]] = re.compile(r"^\s*\*{0,2}Rewritten:")
CHECKED: Final[re.Pattern[str]] = re.compile(r"^\s*\*{0,2}Checked:")
QUOTED: Final[re.Pattern[str]] = re.compile(r"`[^`]*`|\"[^\"]*\"|“[^”]*”")
FIRST_LETTER: Final[str] = "a"
FEWEST_OPTIONS: Final[int] = 2
FEWEST_REASON_WORDS: Final[int] = 3
STOP_HOOK_ACTIVE: Final[str] = "stop_hook_active"
TRANSCRIPT_PATH: Final[str] = "transcript_path"
