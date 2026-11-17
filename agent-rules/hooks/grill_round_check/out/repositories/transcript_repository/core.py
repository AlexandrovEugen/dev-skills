import json
from pathlib import Path
from typing import Any

from ...values.grill_turns import GrillTurns
from .helpers import ends_grill, is_prompt, is_reply, starts_grill, text_of


class TranscriptRepository:
    def entries(self, transcript: Path) -> list[dict[str, Any]]:
        lines = transcript.read_text(encoding="utf-8", errors="replace").splitlines()
        return [entry for entry in (json.loads(line) for line in lines if line.strip()) if isinstance(entry, dict)]

    def turns(self, transcript: Path) -> GrillTurns:
        entries = self.entries(transcript)
        starts = [index for index, entry in enumerate(entries) if starts_grill(entry)]
        prompts = [index for index, entry in enumerate(entries) if is_prompt(entry)]
        ends = [index for index, entry in enumerate(entries) if ends_grill(entry)]
        if not starts or not prompts or (ends and ends[-1] > starts[-1]):
            return GrillTurns("", ())
        final = "\n".join(text_of(entry) for entry in entries[prompts[-1] + 1 :] if is_reply(entry))
        earlier = tuple(text_of(entry) for entry in entries[starts[-1] : prompts[-1]] if is_reply(entry))
        return GrillTurns(final, earlier)
