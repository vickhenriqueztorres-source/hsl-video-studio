# HSL Video Studio — instalação e migração

A produção roda pelo **Matrix CLI**. O painel HTML apenas mostra episódios,
mapas de agentes, logs e arquivos. Este projeto usa **LangGraph.js/TypeScript**:
as dependências principais estão em `package.json` e `package-lock.json`.
Python atende Drive, fallback de narração e ferramentas auxiliares. Não existe
`cli.py`; a entrada real é `npm.cmd run hsl:matrix`. Não instalamos os pacotes
Python langgraph, langchain, typer ou rich, pois não são importados pelo projeto.

## Instalar no outro PC

O pipeline completo é Windows-first. Ambiente da origem: Node **22.17.0** e
Python **3.13.5**. Instale Git, Node/npm, Python, Chrome e FFmpeg/ffprobe, com
seus comandos no PATH. Instale também as CLIs usadas pelo projeto: `codex` e
`agy` (Antigravity). Instalar só a IDE não garante a presença dessas CLIs.

```powershell
git clone https://github.com/vickhenriqueztorres-source/hsl-video-studio.git C:\HSL\hsl-video-studio
cd C:\HSL\hsl-video-studio
# Enquanto esta entrega nao estiver integrada em main:
git switch codex/phase2.5-drive-storage
node --version
python --version
ffmpeg -version
ffprobe -version
npm.cmd ci
python -m venv .venv
# Ativacao opcional: .\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npx.cmd remotion browser ensure
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
notepad .env
```

Após ativar a venv, `pip install -r requirements.txt` também funciona. Não copie
`node_modules/` nem `.venv/` da origem. Se o npm precisar compilar SQLite,
instale as ferramentas C++ de compilação do Visual Studio. Linux/macOS não
foram validados para este pipeline completo.

## Configuração e contas

Ajuste os caminhos absolutos da `.env`. `HSL_PYTHON` aponta para a venv acima.
Coloque o JSON OAuth do Google fora do repo, na pasta privada indicada por
`HSL_GOOGLE_CLIENT_SECRET_FILE`. O ID da pasta Drive está no exemplo, sem tokens.

```powershell
npm.cmd run hsl:codex:login
npm.cmd run hsl:codex:status
npm.cmd run hsl:antigravity:login
npm.cmd run hsl:antigravity:status
npm.cmd run hsl:drive:auth
npm.cmd run hsl:drive:check
npm.cmd run hsl:elevenlabs:keys
```

Complete os logins no navegador indicado pela ferramenta. No Matrix, `[A]`
gerencia contas e `[E]` gerencia chaves ElevenLabs. Não publique `.env`, tokens,
cookies, `auth.json` ou cofres no GitHub. Pode transferir a `.env` por canal
privado, ajustando os paths. **O cofre ElevenLabs usa DPAPI do usuário Windows:
cadastre as chaves novamente no destino.** Refaça os logins das CLIs e Adobe.

## Agente Firefly e assets externos

O adaptador está em `graph/production/lib/firefly/`, mas o motor Python é externo.
O clone sozinho não contém `firefly_bot`. Transfira o código da pasta definida
por `HSL_FIREFLY_AGENT_DIR` na origem, incluindo `main.py`, `firefly_bot/`,
`requirements.txt` e demais recursos do agente; exclua venv, cookies e perfis.

```powershell
cd C:\HSL\firefly-agent
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
New-Item -ItemType Directory -Force C:\HSL-FIREFLY-PROFILE | Out-Null
cd C:\HSL\hsl-video-studio
```

Configure `HSL_FIREFLY_AGENT_DIR=C:/HSL/firefly-agent` e
`HSL_FIREFLY_CHROME_PROFILE=C:/HSL-FIREFLY-PROFILE`. Faça login Adobe quando o
grafo solicitar. O agente exige sua própria `.venv/Scripts/python.exe`,
independentemente de `HSL_PYTHON`.

Restaure por Drive/backup privado, mantendo os caminhos relativos:

| Conteúdo | Finalidade |
| --- | --- |
| `assets/audio-library/` e assets próprios | Acervo original de áudio e referências |
| Mídias de `assets/` e `public/` | Assets exigidos pelos respectivos fluxos |
| `runs/`, incluindo `.catalog/theme-registry.json` | Histórico, filas e bloqueio de temas repetidos |
| `deliveries/` e `public/audio/` | Entregas e áudio dos episódios |
| `database/langgraph-checkpoints.sqlite` | Retomada de execuções anteriores |

`docs/graph/EXPORT-MEDIA.json` lista as mídias retiradas do índice nesta preparação.
Não contém os arquivos nem comprova upload ao Drive. `npm.cmd run hsl:sfx-sync`
baixa o catálogo Kenney, mas não restaura assets personalizados.

Antes de copiar SQLite, pare todos os processos que escrevem no banco ou use
backup/VACUUM INTO. Não copie apenas o `.sqlite` durante escrita em WAL.
Checkpoints e recibos podem guardar caminhos absolutos antigos: retomada em
outro diretório exige validação/migração desses caminhos e não é automática.
Novos episódios não dependem de copiar checkpoints antigos.

## Rodar

Entre sempre na pasta que contém este `package.json`:

```powershell
cd C:\HSL\hsl-video-studio
npm.cmd run hsl:matrix
```

Escolha `[1] Criar novo episódio`, depois o número do tema. Nome e ID são
automáticos. O modo de planejamento para antes das imagens/Kling, mas ainda
usa as contas dos agentes. Gates ficam visíveis na CLI e no checkpoint.

```powershell
npm.cmd run hsl:matrix -- ajuda
npm.cmd run hsl:matrix -- doctor
npm.cmd run hsl:matrix -- episodios
npm.cmd run hsl:matrix -- status HSL_EPISODE_011
npm.cmd run hsl:matrix -- logs HSL_EPISODE_011
npm.cmd run hsl:matrix -- continuar HSL_EPISODE_011
# Em outro terminal: painel somente de observacao, http://127.0.0.1:2030/
npm.cmd run hsl:dashboard
```

Para passar um tema por argumento (equivalente à ideia de `python cli.py run
"prompt"`), use a CLI real com ID ainda não usado. Este diagnóstico executa
**somente scene_plan**, grava checkpoint e retorna **exit 3** por `--until`:

```powershell
npm.cmd run hsl:master:graph -- --episode HSL_EPISODE_100 --topic "Como uma cidade mantem a pressao da agua" --target-minutes 3 --storage off --max-generations 0 --until scene_plan
```

Isso não testa o pipeline completo. Storage tem default `drive`; prune tem
default `dry-run`. Não execute `--prune apply` na migração nem habilite despacho
Kling pago na `.env`. O fallback humano da revisão de imagens ainda existe;
sua remoção não faz parte desta preparação de exportação.

## Estrutura de pastas

```text
hsl-video-studio/
├── .agents/skills/          # Contratos dos workers
├── graph/
│   ├── console/            # Matrix CLI + painel HTML
│   ├── ide/                # Drivers CLI, contas e workers
│   ├── production/         # StateGraph, nos, testes, render e storage
│   ├── lib/                # Processos externos seguros
│   ├── checkpointer.ts     # SQLite
│   └── langgraph.json      # LangGraph.js Studio
├── hsl/                    # Engines e orquestrador legado
├── adapters/               # Integracoes
├── remotion/               # Composicoes
├── sfx-agent/              # Agente de som
├── scripts/                # Drive Python e utilitarios
├── assets/                 # Catalogos; acervo transferido separadamente
├── public/                 # Assets e midias locais
├── database/               # Schema versionado; checkpoints locais
├── runs/                   # Filas, catalogo, logs e estado auxiliar (local)
├── deliveries/             # Entregas (local/Drive)
├── docs/graph/             # Guias e inventario de migracao
├── .env.example            # Modelo sem segredos
├── .gitignore
├── package.json
├── package-lock.json       # Dependencias Node resolvidas
├── requirements.txt        # Dependencias Python auxiliares
└── README.md
```

## Commit e push

Este diretório já possui Git e `origin`. Não precisa executar `git init`,
adicionar outro remote ou renomear a branch para main. No PC original:

```powershell
cd "D:\HSL STUDIO AGENTS\hsl-video-studio"
git status --short
git diff --stat
git diff --cached --stat
# Confira tambem as alteracoes anteriores que ja estavam na pasta:
git add .
git diff --cached --stat
# Deve listar apenas .env.example, nenhum arquivo real de credenciais:
git ls-files -- .env '.env.*' '*client_secret*.json' '*credentials*.json' '*token*.json' auth.json
git commit -m "Prepare Matrix LangGraph project for another Windows PC"
git push -u origin codex/phase2.5-drive-storage
```

O commit inclui alterações anteriores selecionadas por `git add .`; confira o
diff antes. Depois integre por pull request em main. Até lá, use a branch acima.

Somente para uma **pasta nova sem `.git`** e um repositório remoto vazio:

```powershell
git init -b main
git add .
git diff --cached --stat
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

O `.gitignore` exclui ambientes, bancos, temporários, saídas, mídia e segredos.
`git rm --cached` preserva os arquivos locais, mas não remove objetos de commits
antigos. Esta preparação não reescreve o histórico nem elimina mídias que já
tenham sido publicadas anteriormente.

## Verificar sem produzir vídeo

```powershell
npx.cmd tsc --noEmit
npm.cmd run hsl:matrix -- ajuda
.\.venv\Scripts\python.exe -m unittest graph.production.storage.test_drive_sync
```

Esses comandos não geram mídia nem fazem upload. Para validar contas, use
`hsl:drive:check` e, após instalar o agente/perfil, `hsl:kling:check`. O último
consulta o ambiente externo sem gerar vídeo. Mais detalhes nos documentos
`docs/graph/RENDER-ENV.md`, `MATRIX-LIVE.md` e `ELEVENLABS-KEYS.md`.
