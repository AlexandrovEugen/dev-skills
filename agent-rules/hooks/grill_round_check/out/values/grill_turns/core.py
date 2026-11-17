from dataclasses import dataclass


@dataclass(frozen=True)
class GrillTurns:
    final: str
    earlier: tuple[str, ...]
