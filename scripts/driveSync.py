import os
import sys
import json
import argparse
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).parent.parent
TOKEN_FILE = ROOT / 'config' / 'token.json'
SERVICE_KEY_FILE = ROOT / 'config' / 'google-drive-key.json'
SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
]

DEFAULT_FOLDER_ID = '1j2tFJVmQrXOLE_aEvlDG1Yo1zQUx-sTq'

def get_drive_service():
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(str(TOKEN_FILE), 'w', encoding='utf-8') as f:
                f.write(creds.to_json())
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
    parser.add_argument('--folder-id', default=DEFAULT_FOLDER_ID, help="Google Drive Root Folder ID")
    parser.add_argument('--action', choices=['all', 'deliveries', 'saves', 'assets', 'sync-episode', 'checkpoint'], default='all')
    parser.add_argument('--episode-id', help="ID do episódio para sync específico")
    parser.add_argument('--dest-subfolder', help="Subpasta de destino no Drive (ex: 03_EPISODE_SAVES/EP_012)")
    parser.add_argument('--files', nargs='*', help="Lista de arquivos para upload em checkpoint")
    args = parser.parse_args()

    service = get_drive_service()
    root_id = args.folder_id

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
