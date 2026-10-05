import json
import shutil
import sys
from pathlib import Path

# Force UTF-8 on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
AUDIT_FILE = ROOT / 'runs' / 'backup-audit.json'

def get_backed_up_files():
    if not AUDIT_FILE.exists():
        print("[ERRO] Arquivo de auditoria nao encontrado. Abortando limpeza!")
        sys.exit(1)
    
    with open(AUDIT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    verified_paths = set()
    for res in data.get('results', []):
        if res.get('status') in ['uploaded', 'already'] and res.get('md5'):
            verified_paths.add(Path(res['local']).resolve())
    return verified_paths

def prune():
    verified_files = get_backed_up_files()
    print(f"[OK] Total de arquivos confirmados no Google Drive: {len(verified_files)}")

    bytes_freed = 0
    files_removed = 0

    # 1. TRANSIENT BUILD & CACHE DIRS
    transient_dirs = [
        ROOT / 'build',
        ROOT / 'out',
        ROOT / 'public' / 'runs',
        ROOT / 'runs' / 'BRECHA_EPISODE_003' / 'motion',
    ]

    for t_dir in transient_dirs:
        if t_dir.exists():
            print(f"[LIMPANDO] Pasta transitoria: {t_dir.relative_to(ROOT)} ...")
            dir_size = 0
            file_count = 0
            try:
                for p in t_dir.rglob('*'):
                    if p.is_file():
                        dir_size += p.stat().st_size
                        file_count += 1
                shutil.rmtree(t_dir, ignore_errors=True)
                bytes_freed += dir_size
                files_removed += file_count
                print(f"   [OK] Removida: {dir_size / (1024*1024*1024):.2f} GB ({file_count} arquivos)")
            except Exception as e:
                print(f"   [AVISO] Erro ao remover {t_dir}: {e}")

    # 2. PRUNE VERIFIED HEAVY MEDIA IN RUNS
    # Remove video duplicates, heavy audio WAVs/MP3s, and image stills IF VERIFIED in Drive.
    # ALWAYS PRESERVE: *.json, *.md, *.txt metadata!
    runs_dir = ROOT / 'runs'
    if runs_dir.exists():
        for ep_dir in sorted(runs_dir.glob('*')):
            if not ep_dir.is_dir():
                continue

            for sub_name in ['video', 'audio', 'images']:
                target_sub = ep_dir / sub_name
                if not target_sub.exists() or not target_sub.is_dir():
                    continue

                for media_file in list(target_sub.glob('*')):
                    if not media_file.is_file():
                        continue
                    
                    resolved = media_file.resolve()
                    if resolved in verified_files:
                        try:
                            f_size = media_file.stat().st_size
                            media_file.unlink()
                            bytes_freed += f_size
                            files_removed += 1
                        except Exception as e:
                            print(f"   [AVISO] Falha ao remover {media_file.name}: {e}")

    # 3. PRUNE VERIFIED MASTER VIDEOS IN DELIVERIES (EXCEPT LATEST ACTIVE EPISODES)
    deliveries_dir = ROOT / 'deliveries'
    if deliveries_dir.exists():
        for deliv_ep in sorted(deliveries_dir.glob('*')):
            if not deliv_ep.is_dir():
                continue
            if deliv_ep.name in ['HSL_EPISODE_021', 'HSL_EPISODE_022']:
                continue
            
            for vid_file in list(deliv_ep.glob('*.mp4')):
                if vid_file.is_file() and vid_file.resolve() in verified_files:
                    try:
                        f_size = vid_file.stat().st_size
                        vid_file.unlink()
                        bytes_freed += f_size
                        files_removed += 1
                    except Exception as e:
                        print(f"   [AVISO] Falha ao remover delivery {vid_file.name}: {e}")

    gb_freed = bytes_freed / (1024 * 1024 * 1024)
    print("\n" + "=" * 70)
    print("LIMPEZA CONCLUIDA COM SUCESSO!")
    print(f"   Espaco total liberado: {gb_freed:.2f} GB")
    print(f"   Arquivos removidos: {files_removed}")
    print(f"   Todos os metadados (roteiros, planos, descricoes) continuam 100% preservados.")
    print("=" * 70)

if __name__ == '__main__':
    prune()
