import os
import sys
import json
import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
TOKEN_FILE = Path(os.environ.get('HSL_GOOGLE_TOKEN_FILE', r'D:\HSL-SECRETS\google-token.json'))
SCOPES = ['https://www.googleapis.com/auth/drive']
ROOT_FOLDER_ID = os.environ.get('HSL_DRIVE_FOLDER_ID', '1j2tFJVmQrXOLE_aEvlDG1Yo1zQUx-sTq')

_FOLDER_CACHE = {}
_FOLDER_LOCK = threading.Lock()

def get_drive_service():
    if not TOKEN_FILE.exists():
        raise FileNotFoundError(f"Token não encontrado em: {TOKEN_FILE}")
    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_FILE.write_text(creds.to_json(), encoding='utf-8')
    return build('drive', 'v3', credentials=creds)

def compute_md5(file_path):
    h = hashlib.md5()
    with open(file_path, 'rb') as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

def ensure_remote_path(service, root_id, parts):
    parent = root_id
    for name in parts:
        cache_key = (parent, name)
        with _FOLDER_LOCK:
            if cache_key in _FOLDER_CACHE:
                parent = _FOLDER_CACHE[cache_key]
                continue
            query = f"mimeType = 'application/vnd.google-apps.folder' and name = '{name}' and '{parent}' in parents and trashed = false"
            res = service.files().list(q=query, spaces='drive', fields='files(id,name)', supportsAllDrives=True, includeItemsFromAllDrives=True).execute()
            found = res.get('files', [])
            if found:
                parent = found[0]['id']
            else:
                body = {'name': name, 'mimeType': 'application/vnd.google-apps.folder', 'parents': [parent]}
                parent = service.files().create(body=body, fields='id', supportsAllDrives=True).execute()['id']
            _FOLDER_CACHE[cache_key] = parent
    return parent

def find_remote_file(service, parent_id, name):
    query = f"name = '{name}' and '{parent_id}' in parents and trashed = false"
    res = service.files().list(q=query, spaces='drive', fields='files(id,name,size,md5Checksum)', supportsAllDrives=True, includeItemsFromAllDrives=True).execute()
    files = res.get('files', [])
    return files[0] if files else None

def collect_backup_items():
    items = []

    # 1. DELIVERIES (Masters MP4, thumbnails, packages)
    deliv_dir = ROOT / 'deliveries'
    if deliv_dir.exists():
        for ep in sorted(deliv_dir.iterdir()):
            if not ep.is_dir() or ep.name.startswith('.'):
                continue
            for f in ep.rglob('*'):
                if f.is_file():
                    rel_to_ep = f.relative_to(ep)
                    remote_sub = f"01_DELIVERIES/{ep.name}/{rel_to_ep.as_posix()}"
                    items.append({
                        'local': f,
                        'remote_subpath': remote_sub,
                        'size': f.stat().st_size,
                        'episode': ep.name,
                        'tier': 'deliverable'
                    })

    # 2. RUNS (Saves, Prompts, Autoral Images, Audio, Master Video)
    runs_dir = ROOT / 'runs'
    if runs_dir.exists():
        for ep in sorted(runs_dir.iterdir()):
            if not ep.is_dir() or ep.name.startswith('.') or not ('EPISODE' in ep.name):
                continue
            ep_name = ep.name

            # Saves & scripts
            for fname in ['scene-plan.json', 'visual-prompts.json', 'audio-plan.json', 'run-manifest.json',
                          'publication-package.json', 'YOUTUBE_PUBLICATION_PACKAGE.md', 'compliance.json',
                          'evidence-package.json', 'titles.txt', 'description.txt', 'youtube-metadata.json']:
                p = ep / fname
                if p.is_file():
                    items.append({
                        'local': p,
                        'remote_subpath': f"03_EPISODE_SAVES/{ep_name}/saves/{fname}",
                        'size': p.stat().st_size,
                        'episode': ep_name,
                        'tier': 'save'
                    })

            # Additional audio plans
            for ap in ep.glob('audio-plan-*.json'):
                if ap.is_file():
                    items.append({
                        'local': ap,
                        'remote_subpath': f"03_EPISODE_SAVES/{ep_name}/saves/{ap.name}",
                        'size': ap.stat().st_size,
                        'episode': ep_name,
                        'tier': 'save'
                    })

            # Autoral stills (images)
            images_dir = ep / 'images'
            if images_dir.exists() and images_dir.is_dir():
                for img in images_dir.glob('*'):
                    if img.is_file() and img.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
                        items.append({
                            'local': img,
                            'remote_subpath': f"03_EPISODE_SAVES/{ep_name}/images/{img.name}",
                            'size': img.stat().st_size,
                            'episode': ep_name,
                            'tier': 'intermediate'
                        })

            # Audio takes & masters
            audio_dir = ep / 'audio'
            if audio_dir.exists() and audio_dir.is_dir():
                for aud in audio_dir.glob('*'):
                    if aud.is_file() and aud.suffix.lower() in ['.mp3', '.wav', '.aac']:
                        items.append({
                            'local': aud,
                            'remote_subpath': f"03_EPISODE_SAVES/{ep_name}/audio/{aud.name}",
                            'size': aud.stat().st_size,
                            'episode': ep_name,
                            'tier': 'intermediate'
                        })

            # Video in runs
            video_dir = ep / 'video'
            if video_dir.exists() and video_dir.is_dir():
                for vid in video_dir.glob('*'):
                    if vid.is_file() and vid.suffix.lower() in ['.mp4', '.mov']:
                        items.append({
                            'local': vid,
                            'remote_subpath': f"03_EPISODE_SAVES/{ep_name}/video/{vid.name}",
                            'size': vid.stat().st_size,
                            'episode': ep_name,
                            'tier': 'intermediate'
                        })

            # Thumbnails in runs
            thumb_dir = ep / 'thumbnails'
            if thumb_dir.exists() and thumb_dir.is_dir():
                for th in thumb_dir.glob('*'):
                    if th.is_file() and th.suffix.lower() in ['.png', '.jpg', '.webp']:
                        items.append({
                            'local': th,
                            'remote_subpath': f"01_DELIVERIES/{ep_name}/thumbnails/{th.name}",
                            'size': th.stat().st_size,
                            'episode': ep_name,
                            'tier': 'deliverable'
                        })

    return items

def process_item(service, item):
    local_path = item['local']
    remote_parts = item['remote_subpath'].split('/')
    folder_parts = remote_parts[:-1]
    filename = remote_parts[-1]

    local_md5 = compute_md5(local_path)
    item['local_md5'] = local_md5

    parent_id = ensure_remote_path(service, ROOT_FOLDER_ID, folder_parts)
    existing = find_remote_file(service, parent_id, filename)

    if existing:
        remote_size = int(existing.get('size', 0))
        remote_md5 = existing.get('md5Checksum')
        if remote_size == item['size'] and remote_md5 == local_md5:
            return {
                'local': str(local_path),
                'remote_subpath': item['remote_subpath'],
                'drive_id': existing['id'],
                'status': 'already',
                'md5': local_md5,
                'size': item['size']
            }

    # Upload or update
    media = MediaFileUpload(str(local_path), resumable=True, chunksize=10*1024*1024)
    for attempt in range(3):
        try:
            if existing:
                res = service.files().update(fileId=existing['id'], media_body=media, fields='id,md5Checksum,size', supportsAllDrives=True).execute()
            else:
                body = {'name': filename, 'parents': [parent_id]}
                res = service.files().create(body=body, media_body=media, fields='id,md5Checksum,size', supportsAllDrives=True).execute()
            
            return {
                'local': str(local_path),
                'remote_subpath': item['remote_subpath'],
                'drive_id': res['id'],
                'status': 'uploaded',
                'md5': res.get('md5Checksum', local_md5),
                'size': item['size']
            }
        except HttpError as e:
            if attempt == 2:
                return {
                    'local': str(local_path),
                    'remote_subpath': item['remote_subpath'],
                    'status': 'error',
                    'error': str(e),
                    'md5': local_md5,
                    'size': item['size']
                }

def main():
    print("=" * 70)
    print("🚀 BACKUP DE EPISÓDIOS PARA O GOOGLE DRIVE (VIDEOS, ÁUDIOS, IMAGENS, ROTEIROS)")
    print("=" * 70)

    service = get_drive_service()
    print("✅ Conectado ao Google Drive com sucesso!")

    items = collect_backup_items()
    total_files = len(items)
    total_bytes = sum(x['size'] for x in items)
    print(f"📦 Total de arquivos mapeados para backup: {total_files} ({total_bytes / (1024*1024*1024):.2f} GB)")

    results = []
    lock = threading.Lock()
    completed = 0
    thread_local = threading.local()

    def worker(item):
        nonlocal completed
        if not hasattr(thread_local, 'service'):
            thread_local.service = get_drive_service()
        res = process_item(thread_local.service, item)
        with lock:
            completed += 1
            results.append(res)
            status_symbol = "⏭️" if res['status'] == 'already' else "⬆️" if res['status'] == 'uploaded' else "❌"
            if completed % 10 == 0 or completed == total_files or res['status'] != 'already':
                size_mb = res['size'] / (1024 * 1024)
                print(f"[{completed}/{total_files}] {status_symbol} {res['status'].upper()} ({size_mb:.1f} MB): {Path(res['local']).name} -> {res['remote_subpath']}", flush=True)

    workers = 4
    with ThreadPoolExecutor(max_workers=workers) as executor:
        list(executor.map(worker, items))

    # Save audit report
    audit_file = ROOT / 'runs' / 'backup-audit.json'
    audit_file.parent.mkdir(parents=True, exist_ok=True)
    
    summary = {
        'total_files': total_files,
        'uploaded_count': sum(1 for r in results if r['status'] == 'uploaded'),
        'already_count': sum(1 for r in results if r['status'] == 'already'),
        'error_count': sum(1 for r in results if r['status'] == 'error'),
        'total_bytes': total_bytes,
        'results': results
    }
    audit_file.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding='utf-8')

    print("\n" + "=" * 70)
    print("📊 RESULTADO DO BACKUP:")
    print(f"   Total de arquivos: {total_files}")
    print(f"   Já existiam no Drive (100% íntegros): {summary['already_count']}")
    print(f"   Enviados com sucesso agora: {summary['uploaded_count']}")
    print(f"   Erros: {summary['error_count']}")
    print(f"   Relatório salvo em: {audit_file}")
    print("=" * 70)

if __name__ == '__main__':
    main()
