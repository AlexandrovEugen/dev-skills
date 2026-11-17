from pathlib import Path

import pytest

from grill_round_check.out.repositories.transcript_repository import TranscriptRepository
from grill_round_check.out.values.grill_turns import GrillTurns

from .helpers import a_grill_skill_call, a_prompt, a_reply, a_skill_body, a_transcript_with


class TestTranscriptRepository:
    def test_gives_no_turns_when_no_grill_started(self, tmp_path: Path) -> None:
        # given
        transcript = a_transcript_with(tmp_path, [a_prompt("Fix the bug."), a_reply("❓ **Q1** - **A question**:")])

        # when
        turns = TranscriptRepository().turns(transcript)

        # then
        assert turns == GrillTurns("", ())

    def test_splits_the_final_turn_from_the_replies_since_the_grill_started(self, tmp_path: Path) -> None:
        # given
        transcript = a_transcript_with(
            tmp_path,
            [
                a_reply("before the grill"),
                a_prompt("<command-name>/mattpocock-skills:grilling</command-name>"),
                a_reply("round 1"),
                a_prompt("Q1 yes"),
                a_reply("round 2, part 1"),
                a_reply("round 2, part 2"),
            ],
        )

        # when
        turns = TranscriptRepository().turns(transcript)

        # then
        assert turns == GrillTurns("round 2, part 1\nround 2, part 2", ("round 1",))

    def test_reads_a_skill_body_as_no_prompt_and_a_skill_call_as_a_grill_start(self, tmp_path: Path) -> None:
        # given
        transcript = a_transcript_with(
            tmp_path,
            [a_prompt("grill me"), a_grill_skill_call(), a_skill_body("Interview the user relentlessly"), a_reply("round 1")],
        )

        # when
        turns = TranscriptRepository().turns(transcript)

        # then
        assert turns == GrillTurns("round 1", ())

    @pytest.mark.parametrize("command", ["to-spec", "to-tickets", "implement", "implement-spec", "tdd", "retro"])
    def test_gives_no_turns_once_a_build_command_ends_the_grill(self, tmp_path: Path, command: str) -> None:
        # given
        transcript = a_transcript_with(
            tmp_path,
            [
                a_prompt("<command-name>/mattpocock-skills:grilling</command-name>"),
                a_reply("round 1"),
                a_prompt(f"<command-name>/mattpocock-skills:{command}</command-name>"),
                a_reply("- the report starts with ❓ **Q1** - **A question**:"),
            ],
        )

        # when
        turns = TranscriptRepository().turns(transcript)

        # then
        assert turns == GrillTurns("", ())

    def test_keeps_the_turns_of_a_grill_started_again_after_a_build_command(self, tmp_path: Path) -> None:
        # given
        transcript = a_transcript_with(
            tmp_path,
            [
                a_prompt("<command-name>/mattpocock-skills:grilling</command-name>"),
                a_reply("round 1"),
                a_prompt("<command-name>/mattpocock-skills:to-spec</command-name>"),
                a_reply("the spec"),
                a_prompt("<command-name>/mattpocock-skills:grill-with-docs</command-name>"),
                a_reply("round 1 again"),
                a_prompt("Q1 yes"),
                a_reply("round 2"),
            ],
        )

        # when
        turns = TranscriptRepository().turns(transcript)

        # then
        assert turns == GrillTurns("round 2", ("round 1 again",))
