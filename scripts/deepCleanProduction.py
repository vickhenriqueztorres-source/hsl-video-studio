import os
import sys
import stat
import shutil
from pathlib import Path

# Force UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(r"D:\HSL STUDIO AGENTS\hsl-video-studio")
RUNS = ROOT / "runs"
OUT = ROOT / "out"
BUILD = ROOT / "build"
PUBLIC = ROOT / "public"
DELIVERIES = ROOT / "deliveries"
SHORTS_OUT = Path(r"D:\AI-YOUTUBE-SHORTS-STUDIO\output")

def on_rm_error(func, path, exc_info):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass

def safe_remove_dir(dir_path: Path) -> int:
    """Removes a directory and returns approx bytes freed."""
    if not dir_path.exists():
        return 0
    size = 0
    try:
        for root, dirs, files in os.walk(dir_path):
            for f in files:
                try:
                    size += os.path.getsize(os.path.join(root, f))
                except Exception:
                    pass
    except Exception:
        pass

    try:
        shutil.rmtree(dir_path, onerror=on_rm_error)
    except Exception as e:
        print(f"  ⚠️ Erro ao remover diretório {dir_path.name}: {e}", flush=True)
    return size

def safe_remove_file(file_path: Path) -> int:
    """Removes a file and returns bytes freed."""
    if not file_path.exists():
        return 0
    size = 0
    try:
        size = file_path.stat().st_size
    except Exception:
        pass

    try:
        os.chmod(file_path, stat.S_IWRITE)
        file_path.unlink()
    except Exception as e:
        print(f"  ⚠️ Erro ao remover arquivo {file_path.name}: {e}", flush=True)
    return size

def format_mb(bytes_val: int) -> str:
    mb = bytes_val / (1024 * 1024)
    if mb >= 1024:
        return f"{mb/1024:.2f} GB ({mb:.1f} MB)"
    return f"{mb:.2f} MB"

def execute_cleanup():
    print("=" * 70, flush=True)
    print("🧹 EXECUTANDO LIMPEZA PROFUNDA DE ARQUIVOS DE PRODUÇÃO", flush=True)
    print("=" * 70, flush=True)

    total_freed = 0

    # 1. REMOTION BUILD / WEBPACK CACHE
    print("\n[1/6] Limpando Cache de Build do Remotion (build/)...", flush=True)
    if BUILD.exists():
        freed = safe_remove_dir(BUILD)
        total_freed += freed
        print(f"  ✅ Removido build/: {format_mb(freed)} liberados.", flush=True)
    else:
        print("  ℹ️ Pasta build/ não existe.", flush=True)

    # 2. PUBLIC MIRROR FRAMES (Redundâncias)
    print("\n[2/6] Limpando Espelhos Públicos de Frames (public/runs/)...", flush=True)
    pub_runs = PUBLIC / "runs"
    if pub_runs.exists():
        freed = safe_remove_dir(pub_runs)
        total_freed += freed
        print(f"  ✅ Removido public/runs/: {format_mb(freed)} liberados.", flush=True)
    pub_pub = PUBLIC / "public"
    if pub_pub.exists():
        freed = safe_remove_dir(pub_pub)
        total_freed += freed
        print(f"  ✅ Removido public/public/: {format_mb(freed)} liberados.", flush=True)

    # 3. REDUNDANT MASTER VIDEOS & TEMP IN OUT/
    print("\n[3/6] Limpando Vídeos Duplicados e Temporários em out/...", flush=True)
    out_freed = 0
    if OUT.exists():
        for item in list(OUT.iterdir()):
            if item.name.endswith(".mp4"):
                # Check if it already exists in deliveries
                ep_match = item.stem.upper()
                deliv_match = DELIVERIES / ep_match / "video" / item.name
                if deliv_match.exists():
                    freed = safe_remove_file(item)
                    out_freed += freed
                    print(f"  ✅ Removido duplicado out/{item.name} (já em deliveries): {format_mb(freed)}", flush=True)
            elif item.name.startswith("temp_") or item.name.startswith("concat_") or item.name.endswith(".log") or item.name.endswith(".json"):
                freed = safe_remove_file(item) if item.is_file() else safe_remove_dir(item)
                out_freed += freed
                print(f"  ✅ Removido temp out/{item.name}: {format_mb(freed)}", flush=True)
            elif item.name == "temp_thumb_props":
                freed = safe_remove_dir(item)
                out_freed += freed
                print(f"  ✅ Removido out/temp_thumb_props: {format_mb(freed)}", flush=True)
    total_freed += out_freed
    print(f"  Subtotal em out/: {format_mb(out_freed)} liberados.", flush=True)

    # 4. RUNS/ TEST & SMOKE FOLDERS
    print("\n[4/6] Limpando Pastas de Testes, Smoke, Fallbacks e Logs em runs/...", flush=True)
    runs_test_freed = 0
    test_count = 0
    if RUNS.exists():
        for item in list(RUNS.iterdir()):
            if item.name in (".catalog", ".storage"):
                continue # Strictly preserve
            
            is_test = (
                item.name.startswith("phase") or
                item.name.startswith("smoke") or
                item.name.startswith("unit") or
                item.name.startswith("test") or
                item.name.startswith("firefly-qa") or
                item.name.startswith("THEME_GEN_") or
                "fallback" in item.name.lower() or
                item.name.startswith("motion-") or
                item.name in ("temp_audio_chunks", "kling-health", "CODEX_CLI_IMAGE_SMOKE") or
                item.name.startswith("HSL-PIPELINE-DRYRUN") or
                item.name.startswith("agy-long-") or
                (item.is_file() and (item.name.endswith(".log") or item.name.endswith(".txt")))
            )
            if is_test:
                freed = safe_remove_dir(item) if item.is_dir() else safe_remove_file(item)
                runs_test_freed += freed
                test_count += 1

    total_freed += runs_test_freed
    print(f"  ✅ {test_count} pastas/arquivos de testes/smoke removidos: {format_mb(runs_test_freed)} liberados.", flush=True)

    # 5. RUNS/ LEGACY EPISODES & INTERMEDIATES
    print("\n[5/6] Limpando Runs de Episódios Antigos e Intermediários Pesados em runs/...", flush=True)
    ep_freed = 0
    legacy_count = 0
    active_eps = {"HSL_EPISODE_029", "HSL_EPISODE_030", "HSL_EPISODE_031"}

    if RUNS.exists():
        for item in list(RUNS.iterdir()):
            if item.name in (".catalog", ".storage") or not item.is_dir():
                continue
            
            # Check legacy episodes
            is_legacy = (
                item.name.startswith("BRECHA_") or
                (item.name.startswith("HSL_EPISODE_") and item.name not in active_eps) or
                item.name.startswith("HSL_TEST_")
            )
            if is_legacy:
                freed = safe_remove_dir(item)
                ep_freed += freed
                legacy_count += 1
                print(f"  ✅ Removido run legado {item.name}: {format_mb(freed)}", flush=True)

        # For active episodes, clean heavy intermediate folders (frames, video, videos, motion, audio takes, checkpoints)
        for act in active_eps:
            ep_dir = RUNS / act
            if ep_dir.exists() and ep_dir.is_dir():
                for sub in ("frames", "video", "videos", "motion", "audio"):
                    sub_p = ep_dir / sub
                    if sub_p.exists():
                        freed = safe_remove_dir(sub_p)
                        ep_freed += freed
                        print(f"  ✅ Prunado intermediário {act}/{sub}/: {format_mb(freed)}", flush=True)
                # Checkpoints SQLite files
                ck_dir = ep_dir / "checkpoints"
                if ck_dir.exists():
                    freed = safe_remove_dir(ck_dir)
                    ep_freed += freed
                    print(f"  ✅ Prunado snapshots checkpoints {act}/checkpoints/: {format_mb(freed)}", flush=True)

    total_freed += ep_freed
    print(f"  Subtotal em runs/ episódios: {format_mb(ep_freed)} liberados ({legacy_count} legados deletados).", flush=True)

    # 6. SHORTS LOOSE TEST FILES & LEGACY SHORT RUNS
    print("\n[6/6] Limpando Arquivos Temporários de Shorts...", flush=True)
    shorts_freed = 0
    if SHORTS_OUT.exists():
        for item in list(SHORTS_OUT.iterdir()):
            if item.is_file():
                freed = safe_remove_file(item)
                shorts_freed += freed
            elif item.name in ("HSL_EPISODE_024", "HSL_EPISODE_025"):
                freed = safe_remove_dir(item)
                shorts_freed += freed
                print(f"  ✅ Removido shorts teste legado {item.name}: {format_mb(freed)}", flush=True)
    total_freed += shorts_freed
    print(f"  Subtotal em shorts/: {format_mb(shorts_freed)} liberados.", flush=True)

    print("\n" + "=" * 70, flush=True)
    print(f"🎉 LIMPEZA CONCLUÍDA COM SUCESSO!", flush=True)
    print(f"ESPAÇO TOTAL LIBERADO NO DISCO: {format_mb(total_freed)}", flush=True)
    print("=" * 70 + "\n", flush=True)

if __name__ == "__main__":
    execute_cleanup()
