import json
from pathlib import Path

from ....out.repositories.transcript_repository import TranscriptRepository
from .constants import STOP_HOOK_ACTIVE, TRANSCRIPT_PATH
from .helpers import round_failures


class GrillRoundCheckService:
    def __init__(self, repository: TranscriptRepository) -> None:
        self._repository = repository

    def failures(self, transcript: Path) -> list[str]:
        turns = self._repository.turns(transcript)
        return round_failures(turns.final, turns.earlier)

    def reply(self, payload: str) -> str:
        hook = json.loads(payload or "{}")
        if hook.get(STOP_HOOK_ACTIVE) or not hook.get(TRANSCRIPT_PATH):
            return ""
        failures = self.failures(Path(hook[TRANSCRIPT_PATH]))
        if not failures:
            return ""
        listed = "\n".join(f"- {failure}" for failure in failures)
        reason = (
            "This turn's frontier breaks the grill's round format. Fix each part, then end the turn again.\n"
            f"{listed}\n"
            "The rules: `grilling`'s \"Format a round like so\" and the round format in the `grilling-ext` skill."
        )
        return json.dumps({"decision": "block", "reason": reason})
