import json
from pathlib import Path

import pytest

from grill_round_check.application.services.grill_round_check_service import GrillRoundCheckService
from grill_round_check.out.repositories.transcript_repository import TranscriptRepository

from .helpers import (
    ANOTHER_QUESTION_UNDER_THE_SAME_NUMBER,
    CHECKED_LINE,
    FULL_QUESTION,
    a_grill_transcript,
    a_round,
    a_stop_payload,
)


class TestGrillRoundCheckService:
    def test_passes_a_round_whose_questions_have_every_part(self, tmp_path: Path) -> None:
        # given
        transcript = a_grill_transcript(tmp_path, a_round(FULL_QUESTION))

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert reply == ""

    def test_passes_a_turn_that_asks_no_question(self, tmp_path: Path) -> None:
        # given
        transcript = a_grill_transcript(tmp_path, "Recorded. The frontier is empty.")

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert reply == ""

    @pytest.mark.parametrize(
        "question, expected",
        [
            ("- ❓ **Q3** Can the dev start fewer loops? ➡️ (a) yes.", "Q3 is a list item"),
            (FULL_QUESTION.replace("- **(b)** Three repairs, then a fresh session.\n", ""), "fewer than two lettered options"),
            (FULL_QUESTION.replace("- **(b)**", "- **(c)**"), "not a, b in order"),
            (FULL_QUESTION.replace("Example: the Implementer of rs-core#31 replies with A1 and A3 to Q1 to Q3.\n", ""), "has no worked example"),
            (FULL_QUESTION.replace("rs-core#31 replies with A1 and A3 to Q1 to Q3", "the Implementer replies badly"), "example holds no number"),
            (FULL_QUESTION.replace("➡️ (a). It keeps what the code does today.", "➡️ Yes."), "has no `➡️` line"),
            (FULL_QUESTION.replace("➡️ (a). It keeps what the code does today.", "➡️ (c). It keeps the code."), "which is not one of its options"),
            (FULL_QUESTION.replace("➡️ (a). It keeps what the code does today.", "➡️ (a)."), "gives no reason"),
            (FULL_QUESTION.replace(" - **How many repairs does a broken reply get?**", ""), "has no title"),
            (FULL_QUESTION.replace(CHECKED_LINE, ""), "is new and has no `Checked:` line"),
        ],
    )
    def test_blocks_a_question_that_misses_a_part(self, tmp_path: Path, question: str, expected: str) -> None:
        # given
        transcript = a_grill_transcript(tmp_path, a_round(question))

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert json.loads(reply)["decision"] == "block"
        assert expected in json.loads(reply)["reason"]

    def test_passes_a_question_sent_again_word_for_word(self, tmp_path: Path) -> None:
        # given
        transcript = a_grill_transcript(tmp_path, a_round(FULL_QUESTION), a_round(FULL_QUESTION))

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert reply == ""

    def test_blocks_a_same_length_question_with_one_changed_word(self, tmp_path: Path) -> None:
        # given
        changed = FULL_QUESTION.replace("It keeps what the code does today.", "It keeps what the code does always.")
        transcript = a_grill_transcript(tmp_path, a_round(FULL_QUESTION), a_round(changed))

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert json.loads(reply)["decision"] == "block"
        assert (
            "Q3 differs from when it was asked last, and has no `Rewritten:` line that says what changed"
            in json.loads(reply)["reason"]
        )

    def test_passes_a_changed_question_that_says_what_was_rewritten(self, tmp_path: Path) -> None:
        # given
        rewritten = FULL_QUESTION.replace("- **(b)** Three repairs", "- **(b)** Two repairs").replace(
            "Example:", "Rewritten: option (b) now gives 2 repairs, not 3; letters (a) and (b) stay.\n\nExample:"
        )
        transcript = a_grill_transcript(tmp_path, a_round(FULL_QUESTION), a_round(rewritten))

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert reply == ""

    def test_passes_a_new_question_that_takes_an_earlier_question_s_number(self, tmp_path: Path) -> None:
        # given
        transcript = a_grill_transcript(
            tmp_path, a_round(FULL_QUESTION), a_round(ANOTHER_QUESTION_UNDER_THE_SAME_NUMBER)
        )

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert reply == ""

    def test_passes_a_question_asked_before_with_no_checked_line(self, tmp_path: Path) -> None:
        # given
        unchecked = FULL_QUESTION.replace(CHECKED_LINE, "")
        transcript = a_grill_transcript(tmp_path, a_round(unchecked), a_round(unchecked))

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert "has no `Checked:` line" not in reply

    @pytest.mark.parametrize(
        "line",
        [
            '- In #149 the report starts with "❓ **Q1** - Does #149 land on map #94?".',
            "- In #149 the report starts with `❓ **Q1** - Does #149 land on map #94?`.",
            "- In #149 the report starts with “❓ **Q1** - Does #149 land on map #94?”.",
        ],
    )
    def test_passes_a_list_line_that_quotes_a_question_tag(self, tmp_path: Path, line: str) -> None:
        # given
        transcript = a_grill_transcript(tmp_path, f"Recorded.\n\n{line}\n\n**Frontier:** empty.")

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript))

        # then
        assert reply == ""

    def test_lets_a_turn_end_that_a_stop_hook_already_sent_back(self, tmp_path: Path) -> None:
        # given
        transcript = a_grill_transcript(tmp_path, a_round("- ❓ **Q3** Broken. ➡️ Yes."))

        # when
        reply = GrillRoundCheckService(TranscriptRepository()).reply(a_stop_payload(transcript, active=True))

        # then
        assert reply == ""
