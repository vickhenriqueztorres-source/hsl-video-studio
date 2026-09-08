from typing import Literal
from .state import HslPipelineState

def should_proceed_after_gatekeeper(state: HslPipelineState) -> Literal["render", "heal", "error"]:
    """
    Conditional routing edge after Gatekeeper validation.
    Permits auto-healing up to 2 attempts before raising a hard error gate.
    """
    if state.get("gatekeeper_passed", False):
        return "render"

    attempts = state.get("recovery_attempts", 0)
    if attempts < 2:
        return "heal"

    return "error"

def should_proceed_after_compliance(state: HslPipelineState) -> Literal["archive", "error"]:
    """
    Conditional routing edge after PRD Compliance verification.
    """
    if state.get("compliance_passed", False):
        return "archive"

    return "error"
