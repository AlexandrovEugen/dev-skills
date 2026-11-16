import json
from pathlib import Path

CHECKED_LINE = "Checked: ADR-0004, GLOSSARY.md Stall, ruling R46.\n"

FULL_QUESTION = f"""❓ **Q3** - **How many repairs does a broken reply get?**

{CHECKED_LINE}Example: the Implementer of rs-core#31 replies with A1 and A3 to Q1 to Q3.
- **(a)** One repair, then a fresh session.
- **(b)** Three repairs, then a fresh session.

➡️ (a). It keeps what the code does today."""

ANOTHER_QUESTION_UNDER_THE_SAME_NUMBER = f"""❓ **Q3** - **Which Coin goes first?**

{CHECKED_LINE}Example: BTC has 304 Signals and ETH 149.
- **(a)** BTC first.
- **(b)** ETH first.

➡️ (a). It has the most Signals."""


def a_round(*questions: str) -> str:
    return "Recorded.\n\n---\n\n" + "\n\n---\n\n".join(questions) + "\n\n---\n\n**Frontier:** Q3."


def a_grill_transcript(root: Path, *replies: str) -> Path:
    entries = [{"type": "user", "message": {"role": "user", "content": "<command-name>/mattpocock-skills:grilling</command-name>"}}]
    for index, reply in enumerate(replies):
        if index:
            entries.append({"type": "user", "message": {"role": "user", "content": "yes"}})
        entries.append({"type": "assistant", "message": {"role": "assistant", "content": [{"type": "text", "text": reply}]}})
    transcript = root / "session.jsonl"
    transcript.write_text("".join(f"{json.dumps(entry)}\n" for entry in entries))
    return transcript


def a_stop_payload(transcript: Path, active: bool = False) -> str:
    return json.dumps({"transcript_path": str(transcript), "stop_hook_active": active})
