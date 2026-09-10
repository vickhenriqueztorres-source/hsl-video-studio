import os
import sys
import json
import argparse
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import InstalledAppFlow

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).parent.parent
TOKEN_FILE = Path(os.environ.get('HSL_GOOGLE_TOKEN_FILE', str(ROOT / 'config' / 'token.json')))
SERVICE_KEY_FILE = ROOT / 'config' / 'google-drive-key.json'
SCOPES = ['https://www.googleapis.com/auth/drive']

DEFAULT_FOLDER_ID = '1j2tFJVmQrXOLE_aEvlDG1Yo1zQUx-sTq'
_FOLDER_CACHE = {}
_FOLDER_LOCK = threading.Lock()

def _safe_error(exc):
    return exc.__class__.__name__

def _load_oauth_credentials(require=False):
    if not TOKEN_FILE.exists():
        if require:
            raise FileNotFoundError('token ausente')
        return None
    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
        TOKEN_FILE.write_text(creds.to_json(), encoding='utf-8')
    if not creds or not creds.valid:
        raise RuntimeError('token inválido')
    return creds

def oauth_auth():
    secret = os.environ.get('HSL_GOOGLE_CLIENT_SECRET_FILE', '')
    if not secret or not Path(secret).is_absolute() or not Path(secret).is_file():
        raise FileNotFoundError('client secret ausente ou não absoluto')
    # Use Google's current OAuth v2 endpoint explicitly. Some freshly-created
    # Desktop client downloads still contain the legacy /o/oauth2/auth URI.
    client_config = json.loads(Path(secret).read_text(encoding='utf-8'))
    client_config['installed']['auth_uri'] = 'https://accounts.google.com/o/oauth2/v2/auth'
    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    creds = flow.run_local_server(
        host='127.0.0.1',
        port=0,
        open_browser=False,
        authorization_prompt_message="AUTH_URL {url}",
        success_message="Autorizacao concluida. Volte ao Codex.",
    )
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(creds.to_json(), encoding='utf-8')

def _execute_retry(factory):
    for attempt in range(3):
        try:
            return factory().execute()
        except HttpError as exc:
            status = getattr(exc.resp, 'status', None)
            if status not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(2 ** attempt)

def _escape_query(value):
    return str(value).replace('\\', '\\\\').replace("'", "\\'")

def ensure_remote_path(service, root_id, parts):
    parent = root_id
    for name in parts:
        cache_key = (parent, name)
        with _FOLDER_LOCK:
            if cache_key in _FOLDER_CACHE:
                parent = _FOLDER_CACHE[cache_key]
                continue
            query = "mimeType = 'application/vnd.google-apps.folder' and name = '%s' and '%s' in parents and trashed = false" % (_escape_query(name), _escape_query(parent))
            result = _execute_retry(lambda: service.files().list(q=query, spaces='drive', fields='files(id,name)', supportsAllDrives=True, includeItemsFromAllDrives=True))
            found = result.get('files', [])
            if found:
                parent = found[0]['id']
            else:
                body = {'name': name, 'mimeType': 'application/vnd.google-apps.folder', 'parents': [parent]}
                parent = _execute_retry(lambda: service.files().create(body=body, fields='id', supportsAllDrives=True))['id']
            _FOLDER_CACHE[cache_key] = parent
    return parent

def find_remote_file(service, parent_id, name):
    query = "name = '%s' and '%s' in parents and trashed = false" % (_escape_query(name), _escape_query(parent_id))
    result = _execute_retry(lambda: service.files().list(q=query, spaces='drive', fields='files(id,name,size,md5Checksum)', supportsAllDrives=True, includeItemsFromAllDrives=True))
    return (result.get('files') or [None])[0]

def find_remote_folder(service, parent_id, name):
    query = "mimeType = 'application/vnd.google-apps.folder' and name = '%s' and '%s' in parents and trashed = false" % (_escape_query(name), _escape_query(parent_id))
    result = _execute_retry(lambda: service.files().list(q=query, spaces='drive', fields='files(id,name)', supportsAllDrives=True, includeItemsFromAllDrives=True))
    found = result.get('files') or []
    return found[0]['id'] if found else None

def resolve_episode_folders(service, root_id, episode_id):
    deliveries_root = find_remote_folder(service, root_id, '01_DELIVERIES')
    saves_root = find_remote_folder(service, root_id, '03_EPISODE_SAVES')
    delivery_episode = find_remote_folder(service, deliveries_root, episode_id) if deliveries_root else None
    save_episode = find_remote_folder(service, saves_root, episode_id) if saves_root else None
    images = find_remote_folder(service, save_episode, 'images') if save_episode else None
    videos = find_remote_folder(service, save_episode, 'video') if save_episode else None
    delivery_video = find_remote_folder(service, delivery_episode, 'video') if delivery_episode else None
    return {'episode': save_episode or delivery_episode, 'images': images, 'videos': videos or delivery_video, 'deliverables': delivery_episode, 'root': root_id}

def _process_verified_item(service, root_folder_id, item, upload):
    base = {'localPath': item.get('localPath')}
    try:
        local = Path(item['localPath'])
        parts = [part for part in str(item['remoteSubpath']).replace('\\', '/').split('/') if part]
        if not local.is_file() or not parts:
            raise FileNotFoundError('arquivo local ou remoteSubpath inválido')
        parent = ensure_remote_path(service, root_folder_id, parts[:-1])
        existing = None
        if item.get('driveFileId'):
            existing = _execute_retry(lambda: service.files().get(fileId=item['driveFileId'], fields='id,md5Checksum,size', supportsAllDrives=True))
        if not existing:
            existing = find_remote_file(service, parent, parts[-1])
        if not upload:
            if not existing:
                return {**base, 'status': 'error', 'error': 'remote ausente'}
            meta = _execute_retry(lambda: service.files().get(fileId=existing['id'], fields='id,md5Checksum,size', supportsAllDrives=True))
            same = meta.get('md5Checksum') == item['md5'] and int(meta.get('size', -1)) == int(item['sizeBytes'])
            return {**base, 'driveFileId': meta['id'], 'driveFolderId': parent, 'remoteMd5': meta.get('md5Checksum'), 'status': 'already' if same else 'mismatch'}
        if existing and existing.get('md5Checksum') == item['md5'] and int(existing.get('size', -1)) == int(item['sizeBytes']):
            file_id, status = existing['id'], 'already'
        else:
            media = MediaFileUpload(str(local), resumable=True, chunksize=10*1024*1024)
            if existing:
                response = _execute_retry(lambda: service.files().update(fileId=existing['id'], media_body=media, fields='id', supportsAllDrives=True))
            else:
                response = _execute_retry(lambda: service.files().create(body={'name': parts[-1], 'parents': [parent]}, media_body=media, fields='id', supportsAllDrives=True))
            file_id, status = response['id'], 'uploaded'
        meta = _execute_retry(lambda: service.files().get(fileId=file_id, fields='id,md5Checksum,size', supportsAllDrives=True))
        same = meta.get('md5Checksum') == item['md5'] and int(meta.get('size', -1)) == int(item['sizeBytes'])
        return {**base, 'driveFileId': file_id, 'driveFolderId': parent, 'remoteMd5': meta.get('md5Checksum'), 'status': status if same else 'mismatch'}
    except Exception as exc:
        return {**base, 'status': 'error', 'error': _safe_error(exc)}

def process_verified_items(service, root_folder_id, items, upload=True, service_factory=None, workers=1):
    total = len(items)
    if total == 0:
        return {'items': []}
    output = [None] * total
    progress = {'completed': 0}
    progress_lock = threading.Lock()
    thread_services = threading.local()

    def run(index):
        active_service = service
        if service_factory:
            if not hasattr(thread_services, 'service'):
                thread_services.service = service_factory()
            active_service = thread_services.service
        output[index] = _process_verified_item(active_service, root_folder_id, items[index], upload)
        with progress_lock:
            progress['completed'] += 1
            completed = progress['completed']
            if completed % 25 == 0 or completed == total:
                print(f"drive-progress {completed}/{total}", file=sys.stderr, flush=True)

    if workers > 1:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            list(executor.map(run, range(total)))
    else:
        for index in range(total):
            run(index)
    return {'items': output}

def get_drive_service():
    if TOKEN_FILE.exists():
        creds = _load_oauth_credentials(require=True)
        return build('drive', 'v3', credentials=creds)
    elif SERVICE_KEY_FILE.exists():
        creds = service_account.Credentials.from_service_account_file(
            str(SERVICE_KEY_FILE),
            scopes=SCOPES
        )
        return build('drive', 'v3', credentials=creds)
    else:
        raise FileNotFoundError("Nenhuma credencial encontrada em config/token.json ou config/google-drive-key.json")

def get_or_create_folder(service, folder_name, parent_id):
    query = f"mimeType = 'application/vnd.google-apps.folder' and name = '{folder_name}' and '{parent_id}' in parents and trashed = false"
    results = service.files().list(
        q=query,
        spaces='drive',
        fields='files(id, name)',
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute()
    files = results.get('files', [])
    if files:
        return files[0]['id']
    
    metadata = {
        'name': folder_name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_id]
    }
    created = service.files().create(
        body=metadata,
        fields='id',
        supportsAllDrives=True
    ).execute()
    print(f"📁 Pasta criada no Drive: {folder_name} (ID: {created.get('id')})", flush=True)
    return created.get('id')

def upload_single_file(service, local_file_path, parent_folder_id):
    path = Path(local_file_path)
    if not path.exists() or not path.is_file():
        return None
    
    query = f"name = '{path.name}' and '{parent_folder_id}' in parents and trashed = false"
    results = service.files().list(
        q=query,
        spaces='drive',
        fields='files(id, name, size)',
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute()
    existing = results.get('files', [])
    
    file_size_mb = path.stat().st_size / 1024 / 1024
    media = MediaFileUpload(str(path), resumable=True, chunksize=10*1024*1024)
    
    if existing:
        remote_size = int(existing[0].get('size', 0))
        if remote_size == path.stat().st_size:
            print(f"⏭️ Já existe no Drive (idêntico): {path.name} ({file_size_mb:.2f} MB)", flush=True)
            return existing[0]['id']
        print(f"🔄 Atualizando no Drive: {path.name} ({file_size_mb:.2f} MB)...", flush=True)
        updated = service.files().update(
            fileId=existing[0]['id'],
            media_body=media,
            supportsAllDrives=True
        ).execute()
        return updated.get('id')
    else:
        print(f"⬆️ Enviando para o Drive: {path.name} ({file_size_mb:.2f} MB)...", flush=True)
        created = service.files().create(
            body={'name': path.name, 'parents': [parent_folder_id]},
            media_body=media,
            fields='id',
            supportsAllDrives=True
        ).execute()
        print(f"✅ Concluído: {path.name}", flush=True)
        return created.get('id')

def upload_folder_recursive(service, local_dir_path, parent_folder_id):
    path = Path(local_dir_path)
    if not path.exists():
        return
    
    dir_id = get_or_create_folder(service, path.name, parent_folder_id)
    for child in sorted(path.iterdir()):
        if child.name.startswith('.') or child.name in ['__pycache__', 'node_modules']:
            continue
        if child.is_file():
            try:
                upload_single_file(service, child, dir_id)
            except Exception as e:
                print(f"❌ Erro ao enviar {child.name}: {e}")
        elif child.is_dir():
            upload_folder_recursive(service, child, dir_id)

def sync_deliveries(service, root_folder_id):
    deliv_dir = ROOT / 'deliveries'
    if not deliv_dir.exists():
        print("Pasta deliveries/ não encontrada.")
        return
    print("\n" + "="*60)
    print("🚀 SINCRONIZANDO 01_DELIVERIES (MÁSTERS MP4, THUMBNAILS 4K E SEO)")
    print("="*60)
    target_folder = get_or_create_folder(service, '01_DELIVERIES', root_folder_id)
    for ep in sorted(deliv_dir.iterdir()):
        if ep.is_dir():
            print(f"\n📦 Episódio: {ep.name}")
            upload_folder_recursive(service, ep, target_folder)

def sync_saves(service, root_folder_id):
    runs_dir = ROOT / 'runs'
    if not runs_dir.exists():
        return
    print("\n" + "="*60)
    print("💾 SINCRONIZANDO 03_EPISODE_SAVES (MANIFESTOS, ROTEIROS E ÁUDIOS MASTER)")
    print("="*60)
    target_folder = get_or_create_folder(service, '03_EPISODE_SAVES', root_folder_id)
    for ep in sorted(runs_dir.iterdir()):
        if ep.is_dir() and not ep.name.startswith('.'):
            ep_target = get_or_create_folder(service, ep.name, target_folder)
            for save_file in ['run-manifest.json', 'scene-plan.json', 'audio-plan.json', 'audio/narration.mp3']:
                p = ep / save_file
                if p.exists() and p.is_file():
                    upload_single_file(service, p, ep_target)

def sync_assets(service, root_folder_id):
    assets_dir = ROOT / 'assets'
    if not assets_dir.exists():
        return
    print("\n" + "="*60)
    print("🎵 SINCRONIZANDO 02_ASSETS_LIBRARY (SONS, TRILHAS E REFERÊNCIAS)")
    print("="*60)
    target_folder = get_or_create_folder(service, '02_ASSETS_LIBRARY', root_folder_id)
    for sub in sorted(assets_dir.iterdir()):
        if sub.is_dir():
            upload_folder_recursive(service, sub, target_folder)

def sync_single_episode(service, root_folder_id, episode_id):
    print(f"\n🚀 [Auto-Save] Sincronizando dados completos do episódio: {episode_id}...", flush=True)
    # 1. Deliveries
    ep_deliv = ROOT / 'deliveries' / episode_id
    if ep_deliv.exists():
        deliv_folder = get_or_create_folder(service, '01_DELIVERIES', root_folder_id)
        upload_folder_recursive(service, ep_deliv, deliv_folder)
    # 2. Saves
    ep_runs = ROOT / 'runs' / episode_id
    if ep_runs.exists():
        saves_folder = get_or_create_folder(service, '03_EPISODE_SAVES', root_folder_id)
        ep_target = get_or_create_folder(service, episode_id, saves_folder)
        for save_file in ['run-manifest.json', 'scene-plan.json', 'audio-plan.json', 'audio/narration.mp3']:
            p = ep_runs / save_file
            if p.exists() and p.is_file():
                upload_single_file(service, p, ep_target)

def upload_checkpoint_files(service, root_folder_id, dest_subfolder, file_paths):
    target_parent = root_folder_id
    for part in dest_subfolder.strip('/').split('/'):
        if part.strip():
            target_parent = get_or_create_folder(service, part.strip(), target_parent)
    for f in file_paths:
        p = Path(f)
        if p.exists() and p.is_file():
            upload_single_file(service, p, target_parent)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--folder-id', default=os.environ.get('HSL_DRIVE_FOLDER_ID', DEFAULT_FOLDER_ID), help="Google Drive Root Folder ID")
    parser.add_argument('--action', choices=['all', 'deliveries', 'saves', 'assets', 'sync-episode', 'checkpoint', 'auth', 'check-auth', 'upload-verified', 'verify', 'resolve-folders'], default='all')
    parser.add_argument('--episode-id', help="ID do episódio para sync específico")
    parser.add_argument('--dest-subfolder', help="Subpasta de destino no Drive (ex: 03_EPISODE_SAVES/EP_012)")
    parser.add_argument('--files', nargs='*', help="Lista de arquivos para upload em checkpoint")
    parser.add_argument('--manifest')
    parser.add_argument('--result')
    args = parser.parse_args()

    if args.action == 'auth':
        try:
            oauth_auth(); print('ok'); return
        except Exception as exc:
            print('error: ' + _safe_error(exc)); raise SystemExit(1)
    if args.action == 'check-auth':
        try:
            _load_oauth_credentials(require=True); print('ok'); return
        except Exception:
            print('error: auth required'); raise SystemExit(2)
    try:
        service = get_drive_service()
    except Exception as exc:
        print('error: ' + _safe_error(exc)); raise SystemExit(1)
    root_id = args.folder_id

    if args.action == 'resolve-folders':
        if not args.episode_id or not args.result:
            print('error: episode-id/result required'); raise SystemExit(1)
        result_path = Path(args.result); result_path.parent.mkdir(parents=True, exist_ok=True)
        result_path.write_text(json.dumps(resolve_episode_folders(service, root_id, args.episode_id), indent=2), encoding='utf-8')
        print('ok'); return

    if args.action in ['upload-verified', 'verify']:
        if not args.manifest or not args.result:
            print('error: manifest/result required'); raise SystemExit(1)
        payload = json.loads(Path(args.manifest).read_text(encoding='utf-8-sig'))
        workers = max(1, min(4, int(os.environ.get('HSL_DRIVE_WORKERS', '4'))))
        result = process_verified_items(
            service,
            payload.get('folderId') or root_id,
            payload.get('items', []),
            upload=args.action == 'upload-verified',
            service_factory=get_drive_service if workers > 1 else None,
            workers=workers,
        )
        result_path = Path(args.result); result_path.parent.mkdir(parents=True, exist_ok=True)
        result_path.write_text(json.dumps(result, indent=2), encoding='utf-8')
        return

    if args.action == 'sync-episode' and args.episode_id:
        sync_single_episode(service, root_id, args.episode_id)
    elif args.action == 'checkpoint' and args.dest_subfolder and args.files:
        upload_checkpoint_files(service, root_id, args.dest_subfolder, args.files)
    else:
        if args.action in ['deliveries', 'all']:
            sync_deliveries(service, root_id)
        if args.action in ['saves', 'all']:
            sync_saves(service, root_id)
        if args.action in ['assets', 'all']:
            sync_assets(service, root_id)

    print("\n🎉 Operação no Google Drive finalizada com sucesso!", flush=True)

if __name__ == '__main__':
    main()
