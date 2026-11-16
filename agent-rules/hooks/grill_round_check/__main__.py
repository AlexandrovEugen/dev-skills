import sys

from .application.services.grill_round_check_service import GrillRoundCheckService
from .out.repositories.transcript_repository import TranscriptRepository

sys.stdout.write(GrillRoundCheckService(TranscriptRepository()).reply(sys.stdin.read()))
