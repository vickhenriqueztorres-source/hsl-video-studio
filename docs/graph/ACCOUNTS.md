# Contas das CLIs usadas pelo LangGraph

O LangGraph executa as CLIs como processos. Não precisa da IDE aberta e não
armazena senha, token ou chave de API no seu estado. Execute o servidor do
grafo com o mesmo usuário Windows que autenticou as ferramentas.

## Codex: geração e revisão de imagens

Na raiz deste projeto, no PowerShell:

```powershell
npm.cmd run hsl:codex:login
npm.cmd run hsl:codex:status
```

O primeiro executa `codex login`: entre com a conta ChatGPT desejada no navegador.
O segundo informa somente se há uma sessão ChatGPT autenticada, sem expor tokens.
A sessão fica sob responsabilidade do próprio Codex CLI, no perfil do usuário
(ou CODEX_HOME quando explicitamente configurado). Não cole credenciais no
LangGraph Studio, em QUEUE.json, no código ou em prompts.

Verificação em 2026-09-03: Codex CLI 0.152.1, `image_generation` habilitado e
login ChatGPT já ativo. Não foi necessário entrar novamente nem alterar a conta.
O login Google Drive é separado; continua em `npm run hsl:drive:auth`.

## Execução automática

```text
env_check → codex_auth_prepare → codex_auth_wait → ...
image_generate_prepare → image_generate_run → image_generate_wait
→ image_review_prepare → image_review_wait → archive_images
```

`codex_auth_prepare` consulta login status. `codex_auth_wait` apenas interrompe
se faltar autenticação, com kind CODEX_AUTH e o comando de login. Ao retomar,
volta ao prepare e revalida a conta. Nenhum spawn fica no nó que interrompe.

`image_generate_run` consome a fila com `codex exec`, ImageGen nativo, prompt
por stdin e resultado JSON por arquivo. Usa workspace-write para geração;
o driver de revisão continua read-only. Ambos usam a sessão ChatGPT existente.
Não há SDK de LLM, script Python de geração nem fallback por chave de API.

Após geração, o processo pai copia e valida PNG/16:9/largura mínima 1920,
grava o recibo SHA-256 e continua o grafo. O filho não executa resumeCommand.
Imagens prontas permanecem intactas. Uma revisão baixa solicita uma nova versão
automaticamente; a segunda reprovação ou revisão indisponível exige o gate
IMAGE_HUMAN_REVIEW. Falhas de geração param em CODEX_IMAGE_UNAVAILABLE ou
IMAGE_GENERATION_RECOVERY. Depois da correção, use:

```powershell
npm.cmd run hsl:master:graph:resume -- --episode HSL_EPISODE_011
```

Também é possível executar somente a fila, sem continuar para Kling:

```powershell
npm.cmd run hsl:images:generate -- --queue runs/HSL_EPISODE_011/images/QUEUE.json
```

## Evidência real

Fila isolada: `runs/CODEX_CLI_IMAGE_SMOKE/images/QUEUE.json`.
Imagem: `runs/CODEX_CLI_IMAGE_SMOKE/images/SMOKE_001/SMOKE_001.png`.
Resultado: PNG 1920×1080; uma geração nativa pelo CLI; chamada concluída em
45,966 segundos. Hash SHA-256:
`155a3aca12b4f5a9d44f8d66ecafd3a2f229d6afb57a2ee9aa6c496c7339fc91`.
Recibo e log ficam na pasta `.codex` do item. Não foram gerados takes Kling.
Uma segunda execução da fila concluiu com o mesmo PNG e `attempts: 1`, sem
outra geração. Passaram os testes da Fase 2 (incluindo login/resume e revisão
com regeneração automática), da Fase 1 e do transporte de revisão Codex.

O log registra uma tentativa de leitura da skill recusada pela política do
subprocesso; o CLI conseguiu gerar pela ferramenta nativa sem essa leitura.
A imagem é uma prova de integração, não uma aprovação editorial do EP 011.

Essa prova substitui a conclusão antiga de que headless não gera: o teste
antigo usava o driver de revisão, que proíbe ferramentas e escrita.
