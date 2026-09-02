import os
import sys
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).parent.parent
CLIENT_SECRET_FILE = ROOT / 'config' / 'client_secret.json'
TOKEN_FILE = ROOT / 'config' / 'token.json'

SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
]

def authenticate():
    flow = InstalledAppFlow.from_client_secrets_file(
        str(CLIENT_SECRET_FILE),
        SCOPES
    )
    
    # Gera URL com prompt para selecionar conta
    auth_url, _ = flow.authorization_url(prompt='select_account', access_type='offline')
    
    print("\n" + "="*70)
    print("COPIE E COLE ESTE LINK NO NAVEGADOR ONDE A CONTA DA ISABELA ESTÁ ABERTA:")
    print("="*70)
    print(auth_url)
    print("="*70 + "\n")
    sys.stdout.flush()

    # Roda o servidor aguardando a autorizacao
    creds = flow.run_local_server(port=8080, open_browser=True)

    with open(str(TOKEN_FILE), 'w', encoding='utf-8') as token:
        token.write(creds.to_json())
    print(f"\n[SUCESSO] Token da conta autorizado e salvo com sucesso em: {TOKEN_FILE}")
    sys.stdout.flush()

if __name__ == '__main__':
    authenticate()
