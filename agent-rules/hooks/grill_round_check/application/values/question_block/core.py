from dataclasses import dataclass


@dataclass(frozen=True)
class QuestionBlock:
    number: int
    lines: tuple[str, ...]
