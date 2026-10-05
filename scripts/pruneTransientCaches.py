import os, sys, shutil
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
RUNS = ROOT / 'runs'

def remove_path(target_path):
    abs_str = os.path.abspath(str(target_path))
    if not abs_str.startswith('\\\\?\\'):
        abs_str = '\\\\?\\' + abs_str

    if os.path.isfile(abs_str):
        try:
            os.chmod(abs_str, 0o777)
            os.remove(abs_str)
            return True
        except Exception:
            return False
    elif os.path.isdir(abs_str):
        for root, dirs, files in os.walk(abs_str, topdown=False):
            for f in files:
                p = os.path.join(root, f)
                try:
                    os.chmod(p, 0o777)
                    os.remove(p)
                except Exception:
                    pass
            for d in dirs:
                p = os.path.join(root, d)
                try:
                    os.chmod(p, 0o777)
                    os.rmdir(p)
                except Exception:
                    pass
        try:
            os.rmdir(abs_str)
            return True
        except Exception:
            return False
    return False

def main():
    print("[INICIO] Limpeza de caches transitorios em runs/ ...")
    
    # 1. Motion dirs in completed episodes
    motion_dirs = []
    for ep in RUNS.glob('*'):
        if ep.is_dir() and ep.name != 'HSL_EPISODE_022':
            m = ep / 'motion'
            if m.is_dir():
                motion_dirs.append(m)
    
    # 2. Frames dirs
    frame_dirs = []
    for ep in RUNS.glob('*'):
        if ep.is_dir() and ep.name != 'HSL_EPISODE_022':
            f = ep / 'frames'
            if f.is_dir():
                frame_dirs.append(f)

    # 3. Audio tests
    at_dirs = [RUNS / '.audio-tests']

    # 4. Checkpoint sqlite files for finished episodes
    checkpoints = []
    for ep in RUNS.glob('*'):
        if ep.is_dir() and ep.name != 'HSL_EPISODE_022':
            for ck in ep.glob('checkpoints/langgraph-checkpoints.sqlite*'):
                if ck.is_file():
                    checkpoints.append(ck)
            for sub_ck in ep.glob('*/runs/*/checkpoints/langgraph-checkpoints.sqlite*'):
                if sub_ck.is_file():
                    checkpoints.append(sub_ck)

    total_items = len(motion_dirs) + len(frame_dirs) + len(checkpoints) + 1
    print(f"Alvos identificados: {len(motion_dirs)} motion dirs, {len(frame_dirs)} frame dirs, {len(checkpoints)} checkpoints sqlite.")

    freed = 0
    for m in motion_dirs:
        print(f"  Removendo motion: {m.relative_to(RUNS)}")
        remove_path(m)

    for f in frame_dirs:
        print(f"  Removendo frames: {f.relative_to(RUNS)}")
        remove_path(f)

    for at in at_dirs:
        if at.exists():
            print(f"  Removendo audio-tests: {at.name}")
            remove_path(at)

    for ck in checkpoints:
        if ck.exists():
            print(f"  Removendo checkpoint sqlite: {ck.relative_to(RUNS)}")
            remove_path(ck)

    print("[CONCLUIDO] Limpeza de caches transitorios finalizada com sucesso.")

if __name__ == '__main__':
    main()
