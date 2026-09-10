import json
import os
import subprocess
import sys
from typing import Dict, Any, Optional

from .state import HslPipelineState

def get_project_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def invoke_typescript_stage(
    stage_name: str,
    state: HslPipelineState,
    dry_run: Optional[bool] = None,
    verbose: bool = True,
    timeout: int = 600
) -> Dict[str, Any]:
    """
    Executes an individual pipeline stage via the TypeScript bridge (hslStageBridge.ts).
    Parses and returns structured JSON output from the stage runner.
    """
    root = get_project_root()
    bridge_script = os.path.join(root, "scripts", "hslStageBridge.ts")

    is_dry = dry_run if dry_run is not None else state.get("dry_run", False)

    cmd = [
        "npx.cmd" if sys.platform == "win32" else "npx",
        "ts-node",
        "-T",
        bridge_script,
        "--stage", stage_name,
        "--episode-id", state.get("episode_id", "HSL_EPISODE_001"),
        "--topic", state.get("topic", "THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING"),
        "--target-minutes", str(state.get("target_minutes", 10)),
        "--entity", state.get("entity", "Airport Jet Fuel Logistics"),
        "--mechanism", state.get("mechanism", "Pipeline to Hydrant Manifold High-Pressure Injection"),
        "--constraint", state.get("constraint", "Hydrant Pressure Collapse at Node D (72 Units/min)"),
        "--consequence", state.get("consequence", "56 Delayed Flights and $2.7M Cascading Economic Loss"),
        "--thesis", state.get("thesis", "The visible product is a flight; the hidden product is synchronized fuel logistics.")
    ]

    if is_dry:
        cmd.append("--dry-run")

    process = None
    try:
        process = subprocess.Popen(
            cmd,
            cwd=root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        stdout_lines = []
        result_payload = None

        if process.stdout:
            for line in process.stdout:
                stdout_lines.append(line)
                clean_line = line.strip()
                if clean_line.startswith("__STAGE_RESULT__:"):
                    raw_json = clean_line[len("__STAGE_RESULT__:"):].strip()
                    try:
                        result_payload = json.loads(raw_json)
                    except Exception:
                        pass
                elif verbose and clean_line:
                    print(f"    [TS] {clean_line}")

        process.wait(timeout=timeout)

        if result_payload:
            return result_payload

        # Fallback if no explicit __STAGE_RESULT__ marker was found
        stderr_output = process.stderr.read() if process.stderr else ""
        if process.returncode == 0:
            return {
                "status": "SUCCESS",
                "stage": stage_name,
                "raw_output": "".join(stdout_lines)
            }
        else:
            return {
                "status": "FAILED",
                "stage": stage_name,
                "error": stderr_output or "".join(stdout_lines) or f"Process exited with code {process.returncode}"
            }

    except subprocess.TimeoutExpired:
        if process:
            process.kill()
        return {
            "status": "FAILED",
            "stage": stage_name,
            "error": f"Processo do estágio {stage_name} excedeu o timeout de {timeout}s e foi terminado."
        }
    except Exception as exc:
        if process:
            try:
                process.kill()
            except Exception:
                pass
        return {
            "status": "ERROR",
            "stage": stage_name,
            "error": str(exc)
        }
