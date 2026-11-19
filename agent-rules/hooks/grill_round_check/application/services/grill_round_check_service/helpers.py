from ...values.question_block import QuestionBlock
from .constants import (
    BLOCK_END,
    CHECKED,
    DIGIT,
    EXAMPLE,
    FEWEST_OPTIONS,
    FEWEST_REASON_WORDS,
    FIRST_LETTER,
    LIST_ITEM,
    OPTION,
    QUESTION_HEAD,
    QUESTION_TAG,
    QUOTED,
    RECOMMENDATION,
    REWRITTEN,
    TITLED_HEAD,
)


def listed_questions(text: str) -> list[str]:
    return [
        f"Q{tag.group(1)} is a list item: a question is its own block that starts with `❓ **Q{tag.group(1)}** - **<title>**:`"
        for line in text.splitlines()
        if LIST_ITEM.match(line) and (tag := QUESTION_TAG.search(QUOTED.sub("", line)))
    ]


def question_blocks(text: str) -> list[QuestionBlock]:
    blocks: list[QuestionBlock] = []
    number: int | None = None
    lines: list[str] = []
    for line in text.splitlines():
        head = QUESTION_HEAD.match(line)
        if head or BLOCK_END.match(line):
            if number is not None:
                blocks.append(QuestionBlock(number, tuple(lines)))
            number, lines = (int(head.group(1)), [line]) if head else (None, [])
        elif number is not None:
            lines.append(line)
    if number is not None:
        blocks.append(QuestionBlock(number, tuple(lines)))
    return blocks


def option_letters(block: QuestionBlock) -> list[str]:
    return [option.group(1) for line in block.lines if (option := OPTION.match(line))]


def asked_text(block: QuestionBlock) -> str:
    return " ".join(QUESTION_HEAD.sub("", " ".join(block.lines), count=1).split())


def title_of(block: QuestionBlock) -> str | None:
    head = TITLED_HEAD.match(block.lines[0])
    return head.group(1).strip().casefold() if head else None


def previous_block(block: QuestionBlock, earlier: tuple[str, ...]) -> QuestionBlock | None:
    title = title_of(block)
    if title is None:
        return None
    for text in reversed(earlier):
        for candidate in reversed(question_blocks(text)):
            if title_of(candidate) == title:
                return candidate
    return None


def block_failures(block: QuestionBlock, previous: QuestionBlock | None) -> list[str]:
    label = f"Q{block.number}"
    letters = option_letters(block)
    expected = [chr(ord(FIRST_LETTER) + index) for index in range(len(letters))]
    examples = [line for line in block.lines if EXAMPLE.match(line)]
    recommendations = [match for line in block.lines if (match := RECOMMENDATION.match(line))]
    failures: list[str] = []
    if not TITLED_HEAD.match(block.lines[0]):
        failures.append(f"{label} has no title: its first line is `❓ **{label}** - **<title>**:`")
    if len(letters) < FEWEST_OPTIONS:
        failures.append(f"{label} has fewer than two lettered options (a), (b)")
    elif letters != expected:
        failures.append(f"{label}'s options are lettered {', '.join(letters)}, not {', '.join(expected)} in order")
    if not examples:
        failures.append(f"{label} has no worked example: a line that starts with `Example`")
    elif not any(DIGIT.search(line) for line in examples):
        failures.append(f"{label}'s example holds no number")
    if not recommendations:
        failures.append(f"{label} has no `➡️` line that starts with one of its options")
    elif recommendations[-1].group(1) not in letters:
        failures.append(f"{label}'s `➡️` line names ({recommendations[-1].group(1)}), which is not one of its options")
    elif len(recommendations[-1].group(2).split()) < FEWEST_REASON_WORDS:
        failures.append(f"{label}'s `➡️` line gives no reason")
    if previous is None and not any(CHECKED.match(line) for line in block.lines):
        failures.append(
            f"{label} is new and has no `Checked:` line naming the ADRs, glossary entries and rulings it was tested against"
        )
    if previous is not None and asked_text(block) != asked_text(previous) and not any(REWRITTEN.match(line) for line in block.lines):
        failures.append(
            f"{label} differs from when it was asked last, and has no `Rewritten:` line that says what changed"
        )
    return failures


def round_failures(final: str, earlier: tuple[str, ...]) -> list[str]:
    failures = listed_questions(final)
    for block in question_blocks(final):
        failures.extend(block_failures(block, previous_block(block, earlier)))
    return failures
