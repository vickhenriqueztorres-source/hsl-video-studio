from typing import TypedDict, Optional, Any, List, Dict

class HslPipelineState(TypedDict, total=False):
    """
    Typed state representation for the HSL Documentary LangGraph pipeline.
    Preserves audit lineage, artifact paths, and execution telemetry across nodes.
    """
    # Episode Metadata
    episode_id: str
    topic: str
    target_minutes: int
    entity: str
    mechanism: str
    constraint: str
    consequence: str
    thesis: str

    # Execution Flow Control
    status: str  # 'IDLE' | 'RUNNING' | 'COMPLETED' | 'BLOCKED' | 'FAILED'
    current_stage: str
    completed_stages: List[str]
    dry_run: bool
    interactive: bool
    recovery_attempts: int

    # Quality Gates & Conformance Flags
    gatekeeper_passed: bool
    auto_recovered: bool
    compliance_passed: bool

    # Stage Artifacts & Registry Data
    artifacts: Dict[str, Any]
    scene_plan_path: Optional[str]
    total_beats: int
    total_frames: int
    frames_count: int
    videos_count: int
    narration_path: Optional[str]
    narration_duration: float
    audio_plan_path: Optional[str]
    temp_visual_path: Optional[str]
    master_video_path: Optional[str]
    master_video_duration: float
    thumbnails: List[str]
    titles: List[Dict[str, Any]]
    compliance_rules_passed: int
    compliance_rules_total: int

    # Telemetry & Logs
    logs: List[str]
    errors: List[str]
