from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from .state import HslPipelineState
from .nodes import (
    node_stage_01_scene_plan,
    node_stage_02_image_frames,
    node_stage_03_firefly_videos,
    node_stage_04_narration,
    node_stage_05_sound_design,
    node_stage_06_pre_render_gate,
    node_gatekeeper_heal,
    node_stage_07_remotion_render,
    node_stage_08_pre_mux_gate,
    node_stage_09_ffmpeg_mux,
    node_stage_10_packaging,
    node_stage_11_prd_compliance,
    node_stage_12_cloud_archive,
    node_error_handler
)
from .edges import should_proceed_after_gatekeeper, should_proceed_after_compliance

def create_hsl_graph() -> StateGraph:
    """
    Constructs the complete 12-stage StateGraph for the HSL pipeline.
    """
    builder = StateGraph(HslPipelineState)

    # 1. Register Stage Nodes
    builder.add_node("stage_01_scene_plan", node_stage_01_scene_plan)
    builder.add_node("stage_02_image_frames", node_stage_02_image_frames)
    builder.add_node("stage_03_firefly_videos", node_stage_03_firefly_videos)
    builder.add_node("stage_04_narration", node_stage_04_narration)
    builder.add_node("stage_05_sound_design", node_stage_05_sound_design)
    builder.add_node("stage_06_pre_render_gate", node_stage_06_pre_render_gate)
    builder.add_node("gatekeeper_heal", node_gatekeeper_heal)
    builder.add_node("stage_07_remotion_render", node_stage_07_remotion_render)
    builder.add_node("stage_08_pre_mux_gate", node_stage_08_pre_mux_gate)
    builder.add_node("stage_09_ffmpeg_mux", node_stage_09_ffmpeg_mux)
    builder.add_node("stage_10_packaging", node_stage_10_packaging)
    builder.add_node("stage_11_prd_compliance", node_stage_11_prd_compliance)
    builder.add_node("stage_12_cloud_archive", node_stage_12_cloud_archive)
    builder.add_node("error_handler", node_error_handler)

    # 2. Add Linear Traversal Edges
    builder.add_edge(START, "stage_01_scene_plan")
    builder.add_edge("stage_01_scene_plan", "stage_02_image_frames")
    builder.add_edge("stage_02_image_frames", "stage_03_firefly_videos")
    builder.add_edge("stage_03_firefly_videos", "stage_04_narration")
    builder.add_edge("stage_04_narration", "stage_05_sound_design")
    builder.add_edge("stage_05_sound_design", "stage_06_pre_render_gate")

    # 3. Add Conditional Gatekeeper Edges (Auto-Healing Loop)
    builder.add_conditional_edges(
        "stage_06_pre_render_gate",
        should_proceed_after_gatekeeper,
        {
            "render": "stage_07_remotion_render",
            "heal": "gatekeeper_heal",
            "error": "error_handler"
        }
    )
    builder.add_edge("gatekeeper_heal", "stage_06_pre_render_gate")

    # 4. Rendering & Audio Alignment Edges
    builder.add_edge("stage_07_remotion_render", "stage_08_pre_mux_gate")
    builder.add_edge("stage_08_pre_mux_gate", "stage_09_ffmpeg_mux")
    builder.add_edge("stage_09_ffmpeg_mux", "stage_10_packaging")
    builder.add_edge("stage_10_packaging", "stage_11_prd_compliance")

    # 5. Add Conditional Compliance Audit Edges
    builder.add_conditional_edges(
        "stage_11_prd_compliance",
        should_proceed_after_compliance,
        {
            "archive": "stage_12_cloud_archive",
            "error": "error_handler"
        }
    )

    # 6. Terminal Edges
    builder.add_edge("stage_12_cloud_archive", END)
    builder.add_edge("error_handler", END)

    return builder

def compile_hsl_graph(checkpointer=None):
    """
    Compiles the HSL StateGraph with optional checkpoint persistence.
    """
    if checkpointer is None:
        checkpointer = MemorySaver()
    builder = create_hsl_graph()
    return builder.compile(checkpointer=checkpointer)
