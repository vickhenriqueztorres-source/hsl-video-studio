import os
import time
from typing import Dict, Any, Callable
from .state import HslPipelineState
from .bridge import invoke_typescript_stage, get_project_root

def with_retry(max_retries: int = 3, initial_delay: float = 2.0, backoff: float = 2.0):
    """
    Decorator para garantir resiliência de produção em cada nó:
    executa até 3 tentativas com recuo exponencial (backoff) antes de falhar.
    """
    def decorator(fn: Callable[[HslPipelineState], Dict[str, Any]]):
        def wrapper(state: HslPipelineState) -> Dict[str, Any]:
            thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
            delay = initial_delay
            last_err = None
            for attempt in range(1, max_retries + 1):
                try:
                    return fn(state)
                except Exception as e:
                    last_err = e
                    print(f"    ⚠️ [{thread_id}] Tentativa {attempt}/{max_retries} falhou com erro: {e}")
                    if attempt < max_retries:
                        print(f"    ⏳ [{thread_id}] Aguardando {delay:.1f}s antes de tentar novamente (retry {attempt + 1})...")
                        time.sleep(delay)
                        delay *= backoff
            raise last_err
        return wrapper
    return decorator

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_01_scene_plan(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🎬 [LangGraph: Node 1/12][{thread_id}] STAGE_01_SCENE_PLAN - HslSceneDirectorAgent")
    res = invoke_typescript_stage("STAGE_01_SCENE_PLAN", state)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_01_SCENE_PLAN falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_01_SCENE_PLAN" not in completed:
        completed.append("STAGE_01_SCENE_PLAN")

    artifacts = dict(state.get("artifacts", {}))
    artifacts["scene_plan_path"] = res.get("scenePlanPath")

    return {
        "current_stage": "STAGE_01_SCENE_PLAN",
        "completed_stages": completed,
        "scene_plan_path": res.get("scenePlanPath"),
        "total_beats": res.get("totalBeats", 96),
        "total_frames": res.get("totalFrames", 18000),
        "artifacts": artifacts,
        "status": "RUNNING"
    }

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_02_image_frames(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🖼️ [LangGraph: Node 2/12][{thread_id}] STAGE_02_IMAGE_FRAMES - HslImageFrameEngine")
    res = invoke_typescript_stage("STAGE_02_IMAGE_FRAMES", state)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_02_IMAGE_FRAMES falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_02_IMAGE_FRAMES" not in completed:
        completed.append("STAGE_02_IMAGE_FRAMES")

    artifacts = dict(state.get("artifacts", {}))
    frames_count = res.get("totalGenerated") or res.get("totalFrames", 60)
    artifacts["frames_count"] = frames_count

    return {
        "current_stage": "STAGE_02_IMAGE_FRAMES",
        "completed_stages": completed,
        "frames_count": frames_count,
        "artifacts": artifacts
    }

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_03_firefly_videos(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🤖 [LangGraph: Node 3/12][{thread_id}] STAGE_03_FIREFLY_VIDEOS - HslFireflyVideoEngine")
    res = invoke_typescript_stage("STAGE_03_FIREFLY_VIDEOS", state)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_03_FIREFLY_VIDEOS falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_03_FIREFLY_VIDEOS" not in completed:
        completed.append("STAGE_03_FIREFLY_VIDEOS")

    artifacts = dict(state.get("artifacts", {}))
    videos_count = res.get("totalVideos", 36)
    artifacts["videos_count"] = videos_count

    return {
        "current_stage": "STAGE_03_FIREFLY_VIDEOS",
        "completed_stages": completed,
        "videos_count": videos_count,
        "artifacts": artifacts
    }

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_04_narration(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🎙️ [LangGraph: Node 4/12][{thread_id}] STAGE_04_NARRATION - ElevenLabsNarrationAdapter")
    res = invoke_typescript_stage("STAGE_04_NARRATION", state)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_04_NARRATION falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_04_NARRATION" not in completed:
        completed.append("STAGE_04_NARRATION")

    artifacts = dict(state.get("artifacts", {}))
    narration_path = res.get("narrationPath") or res.get("targetAudioPath")
    duration = res.get("durationSeconds", 600.0)
    artifacts["narration_path"] = narration_path
    artifacts["narration_duration"] = duration

    return {
        "current_stage": "STAGE_04_NARRATION",
        "completed_stages": completed,
        "narration_path": narration_path,
        "narration_duration": duration,
        "artifacts": artifacts
    }

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_05_sound_design(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🎧 [LangGraph: Node 5/12][{thread_id}] STAGE_05_SOUND_DESIGN - SoundDesignAgent")
    res = invoke_typescript_stage("STAGE_05_SOUND_DESIGN", state)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_05_SOUND_DESIGN falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_05_SOUND_DESIGN" not in completed:
        completed.append("STAGE_05_SOUND_DESIGN")

    artifacts = dict(state.get("artifacts", {}))
    audio_plan_path = res.get("audioPlanPath")
    artifacts["audio_plan_path"] = audio_plan_path

    return {
        "current_stage": "STAGE_05_SOUND_DESIGN",
        "completed_stages": completed,
        "audio_plan_path": audio_plan_path,
        "artifacts": artifacts
    }

@with_retry(max_retries=2, initial_delay=2.0)
def node_stage_06_pre_render_gate(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🛡️ [LangGraph: Node 6/12][{thread_id}] STAGE_06_PRE_RENDER_GATE - Physical Validation Gatekeeper")
    if state.get("dry_run", False):
        print(f"    [{thread_id}][Dry-Run] Gatekeeper verificado em modo simulação (100% dos slots validados).")
        passed = True
        auto_rec = False
    else:
        res = invoke_typescript_stage("STAGE_06_PRE_RENDER_GATE", state)
        passed = res.get("passed", False)
        auto_rec = res.get("autoRecovered", False)

    completed = list(state.get("completed_stages", []))
    if passed and "STAGE_06_PRE_RENDER_GATE" not in completed:
        completed.append("STAGE_06_PRE_RENDER_GATE")

    return {
        "current_stage": "STAGE_06_PRE_RENDER_GATE",
        "completed_stages": completed,
        "gatekeeper_passed": passed,
        "auto_recovered": auto_rec
    }

def node_gatekeeper_heal(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    attempts = state.get("recovery_attempts", 0) + 1
    print(f"\n🔄 [LangGraph: Auto-Heal][{thread_id}] Tentativa de auto-cura #{attempts} disparada para assets pendentes...")
    invoke_typescript_stage("STAGE_02_IMAGE_FRAMES", state)
    invoke_typescript_stage("STAGE_03_FIREFLY_VIDEOS", state)
    return {
        "recovery_attempts": attempts
    }

@with_retry(max_retries=3, initial_delay=3.0)
def node_stage_07_remotion_render(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🎥 [LangGraph: Node 7/12][{thread_id}] STAGE_07_REMOTION_RENDER - 1080p Chunked Render")
    res = invoke_typescript_stage("STAGE_07_REMOTION_RENDER", state, timeout=900)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_07_REMOTION_RENDER falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_07_REMOTION_RENDER" not in completed:
        completed.append("STAGE_07_REMOTION_RENDER")

    temp_visual = res.get("tempVisualPath")
    artifacts = dict(state.get("artifacts", {}))
    artifacts["temp_visual_path"] = temp_visual

    return {
        "current_stage": "STAGE_07_REMOTION_RENDER",
        "completed_stages": completed,
        "temp_visual_path": temp_visual,
        "artifacts": artifacts
    }

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_08_pre_mux_gate(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🔊 [LangGraph: Node 8/12][{thread_id}] STAGE_08_PRE_MUX_GATE - Duration & Audio-Video Alignment")
    res = invoke_typescript_stage("STAGE_08_PRE_MUX_GATE", state)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_08_PRE_MUX_GATE falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_08_PRE_MUX_GATE" not in completed:
        completed.append("STAGE_08_PRE_MUX_GATE")

    artifacts = dict(state.get("artifacts", {}))
    if "narrationQaPath" in res:
        artifacts["narration_qa_path"] = res["narrationQaPath"]

    return {
        "current_stage": "STAGE_08_PRE_MUX_GATE",
        "completed_stages": completed,
        "artifacts": artifacts
    }

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_09_ffmpeg_mux(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n🔊 [LangGraph: Node 9/12][{thread_id}] STAGE_09_FFMPEG_MUX - Master Audio Muxer")
    res = invoke_typescript_stage("STAGE_09_FFMPEG_MUX", state)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_09_FFMPEG_MUX falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_09_FFMPEG_MUX" not in completed:
        completed.append("STAGE_09_FFMPEG_MUX")

    master_video = res.get("masterVideoPath")
    artifacts = dict(state.get("artifacts", {}))
    artifacts["master_video_path"] = master_video

    return {
        "current_stage": "STAGE_09_FFMPEG_MUX",
        "completed_stages": completed,
        "master_video_path": master_video,
        "master_video_duration": res.get("durationSeconds", state.get("narration_duration", 600.0)),
        "artifacts": artifacts
    }

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_10_packaging(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n📦 [LangGraph: Node 10/12][{thread_id}] STAGE_10_PACKAGING - 3x 4K Thumbnails + Strategic SEO")
    res = invoke_typescript_stage("STAGE_10_PACKAGING", state)
    if res.get("status") in ["FAILED", "ERROR"]:
        raise RuntimeError(f"STAGE_10_PACKAGING falhou: {res.get('error')}")

    completed = list(state.get("completed_stages", []))
    if "STAGE_10_PACKAGING" not in completed:
        completed.append("STAGE_10_PACKAGING")

    artifacts = dict(state.get("artifacts", {}))
    titles = res.get("titles", [])
    artifacts["titles"] = titles
    artifacts["thumbnailsCount"] = res.get("thumbnailsCount", 3)

    return {
        "current_stage": "STAGE_10_PACKAGING",
        "completed_stages": completed,
        "titles": titles,
        "artifacts": artifacts
    }

@with_retry(max_retries=2, initial_delay=2.0)
def node_stage_11_prd_compliance(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n📋 [LangGraph: Node 11/12][{thread_id}] STAGE_11_PRD_COMPLIANCE - 100% Rule Compliance Audit")
    if state.get("dry_run", False):
        print(f"    [{thread_id}][Dry-Run] Auditoria de conformidade com o PRD simulada: 100% de conformidade.")
        passed = True
        total = 12
        passed_rules = 12
    else:
        res = invoke_typescript_stage("STAGE_11_PRD_COMPLIANCE", state)
        passed = res.get("passed", False)
        total = res.get("totalRules", 12)
        passed_rules = res.get("passedRules", 0)

    completed = list(state.get("completed_stages", []))
    if passed and "STAGE_11_PRD_COMPLIANCE" not in completed:
        completed.append("STAGE_11_PRD_COMPLIANCE")

    return {
        "current_stage": "STAGE_11_PRD_COMPLIANCE",
        "completed_stages": completed,
        "compliance_passed": passed,
        "compliance_rules_passed": passed_rules,
        "compliance_rules_total": total
    }

@with_retry(max_retries=3, initial_delay=2.0)
def node_stage_12_cloud_archive(state: HslPipelineState) -> Dict[str, Any]:
    thread_id = state.get("thread_id", state.get("episode_id", "prod_1"))
    print(f"\n☁️ [LangGraph: Node 12/12][{thread_id}] STAGE_12_CLOUD_ARCHIVE - Google Drive Backup & Disk Pruning")
    invoke_typescript_stage("STAGE_12_CLOUD_ARCHIVE", state)
    completed = list(state.get("completed_stages", []))
    if "STAGE_12_CLOUD_ARCHIVE" not in completed:
        completed.append("STAGE_12_CLOUD_ARCHIVE")

    print(f"\n🎉 [LangGraph][{thread_id}] Episódio concluído com sucesso!")
    return {
        "current_stage": "STAGE_12_CLOUD_ARCHIVE",
        "completed_stages": completed,
        "status": "COMPLETED"
    }

def node_error_handler(state: HslPipelineState) -> Dict[str, Any]:
    print("\n🛑 [LangGraph: Error Handler] Pipeline interrompido devido a bloqueio de gate.")
    errors = list(state.get("errors", []))
    if not state.get("gatekeeper_passed", True):
        errors.append("GATEKEEPER_BLOCKED: Assets físicos ausentes ou corrompidos após tentativas de cura.")
    if not state.get("compliance_passed", True):
        errors.append("PRD_COMPLIANCE_FAILED: Entregável não atendeu a todos os critérios do PRD.")

    return {
        "status": "BLOCKED",
        "errors": errors
    }
