# Fase 2.5 — Google Drive como storage do grafo

Data: 2026-09-02. Branch: `codex/phase2.5-drive-storage`.

## Pré-requisitos

O branch `codex/phase2-real-media` foi rebased sobre `origin/main` em
`2456c95`, e o branch desta fase foi criado a partir desse resultado.
`origin/main` é ancestral do HEAD.

O commit `2456c95` faz três mudanças: executa automaticamente o bot de
imagens ChatGPT para cada beat `generated_image_35mm`, procura o bot no
checkout e no diretório histórico, e adiciona ao gatekeeper uma regra SHA-256
que exige ao menos 80% de imagens distintas quando existem dez ou mais beats
fotorrealistas.

Isso colide semanticamente com o fluxo real do grafo: a skill
`hsl-image-worker` e os nós `image_generate_*` exigem
`generator: codex-imagegen`, enquanto o engine legado agora aciona o bot
ChatGPT. A solução proposta, ainda não implementada, é uma fronteira explícita
por modo: o master legado conserva o bot ChatGPT; o grafo real conserva geração
exclusiva pelo Codex e incorpora somente a checagem de diversidade SHA-256
antes da revisão.

O rebase expôs contratos TypeScript quebrados no próprio main. O commit
`dca09d1` restaurou a compilação ao ampliar `HslNarrativeRole`, tornar
`promptSubject` opcional, importar `spawn` no storage legado e declarar
`STAGE_12_CLOUD_ARCHIVE` no manifest. O orquestrador não foi editado.

A suíte estrutural da Fase 1 passa integralmente em `mediaMode=legacy`,
incluindo cache, gates, `--until`, retomada após kill e paridade do manifest
consigo mesmo. A comparação real do EP 011 até STAGE_11 não foi repetida:
o manifest atual foi reinicializado pela execução real incompleta da Fase 2 e
está com os estágios pendentes; a referência completa permanece em
`docs/graph/reference/ep011-run-manifest.json`. O comparador continua
ignorando STAGE_12.

## Varredura de segredos

`git ls-files` e o histórico de adições em todos os refs retornaram zero
paths contendo `client_secret`, `token.json` ou `service_account`.
O client OAuth e o token ficam fora do repositório, referenciados somente por
`HSL_GOOGLE_CLIENT_SECRET_FILE` e `HSL_GOOGLE_TOKEN_FILE`. O token foi
criado pelo endpoint OAuth v2 com loopback e `hsl:drive:check` retornou
`ok`.

## Implementação

- `driveSync.py` ganhou `auth`, `check-auth`, `upload-verified` e
  `verify`, retry 3x para 429/5xx, upload resumável e releitura obrigatória de
  MD5 e tamanho.
- `storage/tiers.ts` classifica paths por estado; o migrador possui heurística
  separada para acervo sem checkpoint.
- MD5 local usa stream. O índice é append-only no estado e deduplicado por path
  ao persistir em `runs/<EP>/storage-index.json`.
- `drive_auth_wait` interrompe com `DRIVE_AUTH`; os cinco archives não
  bloqueiam produção; `prune_verified` é o único nó que remove arquivos.
- O snapshot SQLite usa `VACUUM INTO`. O índice é espelhado depois que os
  resultados dos demais uploads foram persistidos, evitando o paradoxo de um
  arquivo conter o próprio MD5.
- O archive final roda depois de `finalize` e antes de `prune_verified`,
  ainda após compliance. Assim, o manifest remoto contém o status final e o
  segundo resume permanece idempotente.
- O migrador preserva o caminho relativo completo. Uma primeira tentativa foi
  interrompida ao detectar que nomes repetidos eram achatados. Nenhum arquivo
  local foi removido. A correção foi validada com 3.762 destinos remotos
  distintos para 3.762 itens.

## Inventário do acervo

| Tier | Arquivos | MB local |
|---|---:|---:|
| transient | 869 | 193,233 |
| intermediate | 2.920 | 599,312 |
| deliverable | 673 | 189,095 |
| save | 169 | 0,805 |
| library | 0 | 0 |
| **Total** | **4.631** | **982,445** |

Elegíveis a upload: 3.762 arquivos, 789,212 MB. `transient` não é enviado e
`assets/audio-library` permanece fora do comando de migração.

## Resultado de upload, verify e prune

A tentativa de upload geral foi interrompida antes de produzir o resultado
final local; o último progresso observado era 2.675/3.762. Ela não está ativa.
A verificação e o prune dry-run desse acervo geral continuam pendentes.
Objetos enviados parcialmente devem ser reconciliados por nome/path/MD5 numa
retomada idempotente, sem assumir que todo o acervo foi arquivado.
Nenhum prune real (`--apply`) foi executado.

O pedido posterior de importar os agentes e assets de som adicionou o comando
separado `hsl:storage:library`. O upload e o verify independente terminaram: 16 arquivos,
104,212 MiB, todos com MD5 remoto igual ao local, zero pending-upload/mismatch.
Ela é armazenada em `02_ASSETS_LIBRARY/`, mantém cópia local e não participa
do prune por episódio. Índice: `runs/.storage/library/storage-index.json`.
Detalhes de importação, integração e testes em `docs/graph/AUDIO-INTEGRATION.md`.

## Testes 16–24

| # | Cenário | Resultado |
|---:|---|---|
| 16 | uploaded/already/mismatch no índice | passou |
| 17 | falha de rede vira pending-upload e não bloqueia | passou |
| 18 | dry-run preserva; apply remove somente verificado | passou |
| 19 | keepLocalDeliverables mantém episódio atual | passou |
| 20 | save nunca é removido | passou |
| 21 | path fora do root é recusado | passou |
| 22 | DRIVE_AUTH interrompe e revalida no resume | passou |
| 23 | storage off não inicia Python e cria índice local | passou |
| 24 | migração de fixture com cinco arquivos | passou |

Também passaram `npx tsc --noEmit`, os três testes Python A3/A4, a suíte da
Fase 1 e os testes 1–16 da Fase 2.

## Backlog legado

O legado mantém três P1 documentados em `docs/graph/BACKLOG.md`:
`hslDriveStorage.ts` usa resolução insegura de Python e checkpoint detached;
o folder ID histórico permanece hardcoded como fallback; e STAGE_12 pode
prunar mesmo quando o sync retorna false. Nenhum desses fluxos foi alterado.

## Divergências

1. O archive de compliance foi posicionado depois de `finalize`, ainda antes
   do END e imediatamente antes do prune, para que `run-manifest.json`
   arquivado contenha `COMPLETED` e seja idempotente no próximo resume.
2. A primeira autenticação gerada pelo endpoint antigo do arquivo de cliente
   foi rejeitada pelo Google com 400. O helper força o endpoint OAuth v2,
   `127.0.0.1` e somente o escopo Drive.
3. A migração inicial foi interrompida após detectar flattening de paths. Os
   objetos parciais dessa tentativa não são usados pelo índice corrigido e não
   foram excluídos sem autorização.
