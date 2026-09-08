# Relatorio da Fase 0 — 2026-09-02

> Estado atual: a **Fase 0.1** abaixo concluiu os smokes reais de Antigravity
> e Codex com sucesso. A secao inicial preserva o registro historico da Fase 0.

Implementacao local em `D:\HSL STUDIO AGENTS\hsl-video-studio`, branch
`codex/phase0-ide-runner`.

**Resultado:** persistencia, contrato de arquivos, validacao e retomada manual
funcionam. Os dois provedores reais ficaram SKIPPED por limites do ambiente;
este spike ainda nao comprova geracao autonoma real de output por essas CLIs.
O criterio de nao reentrar literalmente na funcao do no conflita com a
semantica de `interrupt`; a garantia implementada e de um unico resultado
logico, sem sobrescrever o trabalho humano.

## Verificacao

| Item | Resultado real |
| --- | --- |
| Novas dependencias diretas | Somente @langchain/langgraph, @langchain/langgraph-checkpoint-sqlite e @langchain/core |
| Dependencias existentes alteradas | 0 |
| SDK de LLM | Nenhum; npm ls dos provedores consultados retornou vazio |
| SQLite | better-sqlite3 11.10.0 deduplicado, checkpointer 1.0.0 |
| npx tsc --noEmit | PASS, exit 0, projeto inteiro |
| Testes do runner | PASS, exit 0 |
| Manual valido em processo separado | PASS, exit 0 |
| Manual com score 200 | FAIL esperado, exit 1, tres erros AJV |
| Escopo do diff | graph/, package.json, package-lock.json e .gitignore |
| git diff --check | PASS |

Os testes do runner usam uma CLI simulada apenas nos testes e cobrem retry
com erros AJV, arquivo valido com exit code 7, cota, ENOENT, output antigo,
contexto manual obrigatorio, path traversal, timeout e extracao do JSON final
sem aceitar telemetria. Nao substituem o smoke das CLIs reais.

## Tabela final de --mode all

Comando: `npm run ide-runner:smoke`.
Exit do processo: **0**, pois todos os modos foram explicitamente ignorados
ou ficaram pendentes. Nao significa que os provedores geraram output.

| mode | ok | skipped | verdict | exitCode | durationMs | outputPath sob runs/ | validationErrors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| antigravity | false | true | SKIPPED | 0 | 11720 | smoke-antigravity-1788360215254/ide/ide_task/1/output.json | ENOENT: arquivo nao produzido |
| codex | false | true | SKIPPED | 1 | 617 | smoke-codex-1788360227197/ide/ide_task/1/output.json | ENOENT: arquivo nao produzido |
| manual | false | true | PENDING | — | 0 | smoke-manual-1788360227863/ide/ide_task/1/output.json | —; requer edicao e --resume |

Tabela completa serializada: `runs/smoke-all-final-results.json`.
Saida completa: `runs/smoke-all-final.log`.

**Antigravity:** a CLI `agy` existe e oferece headless, mas a ferramenta
`read_file` foi automaticamente negada porque headless nao pode pedir
confirmacao. Retornou CANCELED com exit 0 e nenhum output. O driver detectou
essa indisponibilidade e nao confundiu exit 0 com sucesso. O git diff --stat
antes/depois foi identico.

**Codex:** versao 0.112.0 recusou o valor `default` de `service_tier` na
configuracao global, aceitando apenas `fast` ou `flex`. A configuracao nao foi
alterada. O primeiro smoke reportou FAIL; o driver foi ajustado para classificar
essa incompatibilidade local como SKIPPED, com motivo explicito. Nenhum JSON
de resultado foi fabricado para fazer o smoke passar.

## Flags reais

Executados antes de escrever os drivers: `agy --help` e `codex exec --help`.

| CLI | Confirmado na ajuda |
| --- | --- |
| agy | -p/--print, --output-format text/json/stream-json, --json-schema, --mode accept-edits/plan, --print-timeout, --disable-slash-commands, --sandbox, --dangerously-skip-permissions |
| codex exec | --sandbox read-only, --output-schema, -o/--output-last-message, --json, --ephemeral, -C/--cd, -c/--config |

Nenhuma flag de referencia estava ausente nesta maquina. Nao foi necessario
usar `antigravity --help`, pois `agy` esta no PATH. O driver nao ativa a flag
de bypass global de permissoes; usa accept-edits e reporta a limitacao headless.
No Codex, `-o` grava a resposta final mantendo o agente em sandbox read-only.
O fallback para versoes sem -o foi testado com eventos simulados.

Detalhes e comandos reproduziveis: [ide/README.md](ide/README.md).

## Teste manual valido — comandos realmente executados

1. `npm run ide-runner:smoke:manual` criou a thread
   `smoke-manual-1788359962775` e retornou o interrupt IDE_MANUAL.
2. Antes de retomar, foram registrados hash e LastWriteTimeUtc de prompt.md.
3. Foi escrito por PowerShell o arquivo de resultado, sem executar uma IDE:

```powershell
'{"score":80,"verdict":"revise","issues":[{"severity":"medium","message":"O segundo plano termina em 9s, alem dos 8s da cena."}]}' |
    Set-Content -LiteralPath 'runs\smoke-manual-1788359962775\ide\ide_task\1\output.json' -Encoding utf8
npm run ide-runner:smoke:resume -- smoke-manual-1788359962775
```

4. O novo processo abriu o mesmo SQLite, enviou Command(resume: {}), validou
   o JSON e concluiu `verdict: PASS`, exit 0, durationMs 2.
5. Verificacao dos artefatos apos retomar:

```text
PROMPT_HASH_UNCHANGED=True
PROMPT_MTIME_UNCHANGED=True
PREPARED_COUNT=1
RESULT_COUNT=1
IDE_TASK_HISTORY_ENTRIES=1
IDE_TASK_ID=61246cab-c5b9-5221-8191-0b0c289540c0
```

Trecho real do historico, em ordem cronologica:

```text
step -1: next=[__start__], resultCount=0
step  0: next=[ide_task],  resultCount=0
         task.id=61246cab-c5b9-5221-8191-0b0c289540c0
step  1: next=[summarize], resultCount=1
step  2: next=[],          resultCount=1
```

Historico completo: `runs/smoke-manual-1788359962775/checkpoint-history.json`.
O historico prova uma unica tarefa logica e um unico resultado concluido.
**Nao prova que a funcao nao reentrou:** a funcao reentra por definicao do
LangGraph. Os arquivos sao preparados de forma idempotente e nao ha CLI
para repetir no modo manual. Esse e o limite preciso do criterio de aceite 5.

## Teste negativo — comandos realmente executados

Uma nova chamada de `npm run ide-runner:smoke:manual` criou
`smoke-manual-1788360090578`. Foi escrito:

```powershell
'{"score":200}' |
    Set-Content -LiteralPath 'runs\smoke-manual-1788360090578\ide\ide_task\1\output.json' -Encoding utf8
npm run ide-runner:smoke:resume -- smoke-manual-1788360090578
```

Resultado: `verdict: FAIL`, exit 1, durationMs 3.

```text
/ must have required property 'verdict'
/ must have required property 'issues'
/score must be <= 100
```

Logs: `runs/manual-negative-start.log` e `runs/manual-negative-resume.log`.
O modo manual falha imediatamente nesse caso. Um retry manual exigiria
outro interrupt/edicao/resume; por isso o retry 1x foi limitado as CLIs,
conforme documentado nas divergencias.

## Pendencias para a Fase 1

- Definir permissoes headless do Antigravity e compatibilizar a configuracao
  do Codex antes de considerar validados os dois provedores reais.
- Aceitar a garantia de execucao logica unica com preparacao idempotente ou
  mudar a posicao do interrupt para exigir ausencia literal de reentrada.
- Fixar o contrato de retry humano: FAIL imediato ou nova solicitacao manual.

Nenhuma alteracao foi feita em hsl/, adapters/, orchestrator/, remotion/,
sound-agent/, spec/, registry/ ou database/schema.sql. Apenas artefatos
ignorados de execucao foram criados em runs/ e no SQLite separado.

## Fase 0.1

Implementada e validada na mesma branch `codex/phase0-ide-runner`.
Novo fluxo: `START → ide_prepare → ide_wait → summarize → END`.

`ide_prepare` prepara o snapshot em disco e executa headless, persistindo
diretorio, caminhos e resultado. `ide_wait` apenas interrompe/le/valida e
passa adiante resultados headless. Nenhum spawn ou escrita de arquivo/log
fica no no com interrupt. Os arquivos existentes de preparacao nao sao regravados.

### Validacao final

| Verificacao | Resultado |
| --- | --- |
| npx.cmd tsc --noEmit | PASS, exit 0, projeto inteiro |
| ideRunner.test.ts | PASS, exit 0 |
| phase01.test.ts | PASS, exit 0: stdout/envelopes, limite de contexto, idempotencia, SQLite reaberto, fallback e negativo |
| all | Antigravity PASS, Codex PASS, manual PENDING; exit 0 |
| all com autofill | Tres PASS; exit 0; apenas manual usa fixture sintetica |
| Manual com score 200 por CLI externo | FAIL esperado, exit 1, tres erros AJV |
| Regra de reentrada | Eventos reais: ide_prepare ×1, ide_wait ×2 |
| Escopo do projeto | graph/; nenhum pacote de projeto novo na Fase 0.1 |
| Config global Codex | Nao editado; continua service_tier = "default" |
| Excecao global autorizada em C.1 | Codex CLI atualizado de 0.112.0 para 0.152.1 via npm |
| git diff --check | PASS |

Os dois outputs reais foram tambem lidos: ambos avaliaram o scene plan e
identificaram o shot terminando em 9s numa cena de 8s e a sobreposicao entre
4s e 5s. Nao sao fixtures nem mensagens de bloqueio disfarçadas de revisao.

### Tabelas finais

Comando executado: `npm.cmd run ide-runner:smoke`.

| mode | ok | skipped | verdict | exitCode | durationMs | autoFilled |
| --- | --- | --- | --- | --- | --- | --- |
| antigravity | true | false | PASS | 0 | 12445 | false |
| codex | true | false | PASS | 0 | 11927 | false |
| manual | false | true | PENDING | — | 0 | false |

Threads e outputs sob `runs/<thread>/ide/ide_task/1/output.json`:

```text
smoke-antigravity-1788362234109-4cc9c3
smoke-codex-1788362246736-531451
smoke-manual-1788362258732-f3dbe9
```

Manual permanece pendente para uso humano. Resultados completos e logs:
[JSON all](../runs/smoke-all-0.1-final-results.json),
[saida all](../runs/smoke-all-0.1-final.log).

Comando executado: `npm.cmd run ide-runner:smoke -- --with-manual-autofill`.

| mode | ok | skipped | verdict | exitCode | durationMs | autoFilled |
| --- | --- | --- | --- | --- | --- | --- |
| antigravity | true | false | PASS | 0 | 11578 | false |
| codex | true | false | PASS | 0 | 12373 | false |
| manual | true | false | PASS | — | 1 | true |

Threads:

```text
smoke-antigravity-1788362264627-a7b8d2
smoke-codex-1788362276392-648c5c
smoke-manual-1788362288830-46ddd2
```

[JSON autofill](../runs/smoke-all-autofill-0.1-final-results.json),
[saida autofill](../runs/smoke-all-autofill-0.1-final.log).
O preenchimento automatico so atende ao provider manual e nunca fabrica
sucesso para uma CLI skipped. No smoke real acima, ambas as CLIs responderam.

### Antigravity: causa raiz, permissoes e comando que funcionou

A causa raiz da Fase 0 era dependencia da ferramenta read_file em headless,
que a politica existente negava. `agy --help` completo confirmou -p/--print,
--output-format, --input-format, --json-schema, --mode, --print-timeout,
--disable-slash-commands, --sandbox e --dangerously-skip-permissions.
Nao existem --yolo, --allowed-tools, --permission-mode ou --auto-approve na
ajuda da versao instalada. Evidencia: `runs/agy-help-0.1.txt`.

Foram inspecionados os caminhos de settings descritos no README: nenhum
JSON encontrado continha permissions.allow/read_file/write_file. Os arquivos
binarios user_settings.pb nao foram modificados. A antiga mensagem citava
permissions.allow em settings.json sem informar o caminho; nao foi assumido
um arquivo de politica sem evidencia. A flag que desativa todas as
confirmacoes existe, mas nao foi necessaria nem utilizada.

O driver agora usa **ioMode stdout por padrao**, le o contexto localmente,
insere blocos `file path=...`, embute o schema no prompt, e recebe somente
JSON pela resposta. O limite acumulado de contexto e configuravel, com
padrao 204800 bytes. O driver persiste o JSON em output.json e valida com AJV.

Comando efetivo:

```text
agy -p <conteudo integral de prompt.md> --output-format json --mode plan --disable-slash-commands --print-timeout 600s
```

O argv completo, inclusive o prompt exato, cwd, stdout e stderr integrais,
esta em [run.log Antigravity](../runs/smoke-antigravity-1788362264627-a7b8d2/ide/ide_task/1/run.log).
O registro `[command]` e um objeto com executable/argv/cwd, sem escaping de shell.

Resposta real: envelope `status=SUCCESS` com JSON interno em `response`.
O output extraido no teste com autofill teve score 65, verdict revise e duas
issues sobre duracao/sobreposicao. O parser tambem trata result/content/text,
fences e strings com chaves/escapes. Nao aceita telemetria vazia como output.

### Codex: causa raiz, configuracao e comando que funcionou

Comandos executados:

```text
codex --version                     -> 0.112.0 inicialmente
npm view @openai/codex version       -> 0.152.1
npm install -g @openai/codex@latest
codex --version                     -> 0.152.1
codex exec --help
```

Foi verificado apenas o campo relevante do config global:
`service_tier = "default"`. Ele continua igual. A nova CLI oferece
`--ignore-user-config`, alem de --sandbox read-only, --output-schema, -o,
--json, --ephemeral e -c. Ajuda completa: `runs/codex-help-0.1.txt`.

O driver usa `--ignore-user-config -c approval_policy="never"`, omite
service_tier e preserva auth no CODEX_HOME. Mantem sandbox read-only e
nao passa --ignore-rules nem qualquer bypass de protecao.

O primeiro teste apos atualizar gerou JSON valido contendo uma declaracao
de bloqueio de leitura do prompt pela politica de execucao. Embora o schema
aceitasse esse JSON, a inspecao do conteudo mostrou que nao havia revisao.
Esse teste preliminar foi descartado como evidencia de viabilidade.
O conteudo do prompt passou entao a ser fornecido diretamente em argv,
dispensando leitura por tools sem alterar a politica.

Comando efetivo final:

```text
codex exec --sandbox read-only --output-schema <schema.json> --json --ignore-user-config -c approval_policy="never" --ephemeral -o <output.json> <prompt completo + instrucoes de transporte>
```

No Windows, esse comando e lancado por Node no bin/codex.js do pacote npm,
com shell:false. O argv exato e a saida integral estao em
[run.log Codex](../runs/smoke-codex-1788362276392-648c5c/ide/ide_task/1/run.log).
O prompt embutido termina com a instrucao de avaliar o scene plan sem tools;
o transporte -o escreve o resultado. Nenhuma flag de schema/saida requerida
estava ausente. O output final real teve score 78, verdict revise e duas issues.

### Historico e prova da reentrada

Thread manual com autofill: `smoke-manual-1788362288830-46ddd2`.

Trecho real de `node-executions.json`, originado no stream debug/task:

```text
initial step=1 ide_prepare id=8e59c263-8318-56f8-81b6-1ca69a20fe20
initial step=2 ide_wait    id=d532bb2c-487a-53ca-b09b-cf847e370e44
resume  step=2 ide_wait    id=d532bb2c-487a-53ca-b09b-cf847e370e44
resume  step=3 summarize  id=c6c83286-b764-588e-8a82-23614a91fe5f
```

Logo: ide_prepare ×1 e ide_wait ×2; o mesmo ID de ide_wait e retomado.
Antes e depois do resume, os snapshots reais de getStateHistory foram
salvos separadamente. Historico final, em ordem cronologica:

```text
step -1 next=[__start__]  resultCount=0
step  0 next=[ide_prepare] resultCount=0
step  1 next=[ide_wait]    resultCount=0
step  2 next=[summarize]   resultCount=1
step  3 next=[]            resultCount=1
```

Evidencias completas:
[antes do resume](../runs/smoke-manual-1788362288830-46ddd2/checkpoint-history.paused.json),
[apos resume](../runs/smoke-manual-1788362288830-46ddd2/checkpoint-history.json),
[entradas dos nos](../runs/smoke-manual-1788362288830-46ddd2/node-executions.json).

O teste phase01.test.ts tambem fecha/reabre SQLite e recompila o grafo entre
pause e resume, comparando bytes e mtime de prompt/schema/log/output.
Todos permanecem iguais durante ide_wait. O caso headless skipped usa
PATH vazio no teste para comprovar fallback sem chamar uma IDE real.

### Negativo manual, por processos separados

Executado npm.cmd run ide-runner:smoke:manual, seguido de:

```powershell
'{"score":200}' | Set-Content -LiteralPath 'runs\smoke-manual-1788362438174-d13102\ide\ide_task\1\output.json' -Encoding utf8
npm.cmd run ide-runner:smoke:resume -- smoke-manual-1788362438174-d13102
```

Resultado: **FAIL, exit 1**, com missingProperty verdict, missingProperty
issues e score <= 100. Nenhuma CLI ou preparacao foi repetida no resume.
Logs: `runs/manual-negative-0.1-start.log` e `runs/manual-negative-0.1-resume.log`.

### Divergencias novas e limites precisos

1. **getStateHistory nao e contador de entradas de funcoes.** O snapshot
   final guarda ide_wait uma vez como tarefa logica. Para provar ×2 sem
   adulterar checkpoints, anexamos snapshots antes/depois e eventos reais
   debug/task. A regra de isolamento solicitada foi implementada.
2. **Atualizacao global:** a instalacao de Codex global e a excecao de escopo
   explicitamente pedida em C.1. Nenhum config global foi editado.
3. **Windows argv:** alem do limite de contexto de 200 KiB, prompts acima
   de 24000 caracteres recebem erro claro antes de spawn. Nao ha truncamento
   silencioso nem uso de um protocolo stdin nao verificado.
4. **Codex recebe prompt inline:** necessario porque a politica de tools
   negou a leitura de arquivo. As regras e o sandbox foram preservados.
5. **PowerShell/npm.ps1:** a primeira tentativa descartou a flag autofill.
   Os comandos finais usam npm.cmd; a saida confirma que a flag chegou ao script.
6. **Threads da Fase 0:** nomes de nos mudaram, portanto checkpoints antigos
   sao rejeitados com instrucao de criar nova thread; nao houve migracao silenciosa.

Nenhuma divergencia exige manter os provedores em SKIPPED: ambos passaram
nos dois smokes finais. A lista acima delimita transporte, evidencias e
compatibilidade, e nao introduz SDK ou HTTP de LLM no grafo.
