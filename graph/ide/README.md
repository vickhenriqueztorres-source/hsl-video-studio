# Fase 0.1 — LangGraph.js + IDE por arquivos e stdout

Fluxo atual: `START → ide_prepare → ide_wait → summarize → END`.
O grafo controla estado/checkpoints; nao instancia ChatModel, nao le chaves
de API e nao faz chamadas HTTP a provedores. As CLIs usam suas sessoes de
autenticacao e inferencia habituais. O prompt do smoke usa um scene plan
fixo e proibe pesquisa/rede e ferramentas de producao.

## Instalacao

Somente tres dependencias diretas novas da Fase 0:

```powershell
npm install --save-exact @langchain/langgraph@1.4.13 @langchain/langgraph-checkpoint-sqlite@1.0.0 @langchain/core@1.2.9
```

Na Fase 0.1 nenhum pacote do projeto foi adicionado. AJV 8.20.0 valida
draft-07 pelo entry point padrao, com allErrors e strict. SQLite reutiliza
better-sqlite3 11.10.0; o saver 1.0.0 evita instalar SQLite 12.
O banco independente e `database/langgraph-checkpoints.sqlite`, com WAL e
fechamento explicito. `database/schema.sql` permanece intacto.

Conforme a autorizacao especifica da Fase 0.1, a CLI global foi atualizada:
`npm install -g @openai/codex@latest`, de 0.112.0 para **0.152.1**.
O arquivo global `~/.codex/config.toml` nao foi editado.

## Smoke

No PowerShell desta maquina, use `npm.cmd` para preservar os argumentos
apos `--` (o wrapper npm.ps1 descartou --with-manual-autofill no teste).

```powershell
npm.cmd run ide-runner:smoke
npm.cmd run ide-runner:smoke -- --mode antigravity
npm.cmd run ide-runner:smoke -- --mode codex
npm.cmd run ide-runner:smoke:manual
npm.cmd run ide-runner:smoke:resume -- <thread_id>
npm.cmd run ide-runner:smoke -- --with-manual-autofill
npx.cmd tsc --noEmit
npx.cmd ts-node graph/smoke/ideRunner.test.ts
npx.cmd ts-node graph/smoke/phase01.test.ts
```

Equivalente direto: `ts-node graph/smoke/runSmoke.ts --mode all --with-manual-autofill`.
Em shells sem esse problema, os mesmos comandos funcionam com npm/npx.

`all` executa os dois provedores reais e deixa manual em PENDING, imprimindo
thread_id, prompt, schema e outputPath. `--with-manual-autofill` escreve uma
fixture valida somente na thread manual e retoma com Command(resume) no
mesmo processo. A coluna `autoFilled=true` identifica explicitamente esse
resultado sintetico. Nunca preenche automaticamente um headless que falhou
ou foi skipped; nesses casos, deixa fallback humano pendente.

Um resume externo reabre o mesmo SQLite em um novo processo. JSON manual
invalido, inclusive `{"score":200}`, conclui FAIL imediatamente, com os erros
AJV e exit 1. Uma thread sem interrupt pendente e rejeitada.
Threads antigas da Fase 0 com o unico no ide_task nao sao migradas: crie uma
nova thread para usar o grafo da Fase 0.1.

Exit 0 significa ausencia de falhas nao ignoradas; pode incluir PENDING ou
SKIPPED/PENDING. Veja a tabela, nao apenas o exit code. `PASS` do transporte
significa JSON conforme schema, nao aprovacao editorial do scene plan.

## Regras de idempotência para nós com interrupt

**Nenhum spawn de CLI nem efeito nao idempotente pode viver no mesmo no que
um interrupt.**

- `ide_prepare` chama prepareAndRunIdeTask: prepara arquivos e executa a CLI
  quando o provider nao e manual. Persiste `ideTaskDir`, `idePrepared` e
  `ideHeadlessResult` no estado antes de avancar.
- `prepareIdeTask` cria prompt/schema/context uma unica vez. Se prompt e
  schema ja existem, preserva o snapshot, mesmo se o template/contexto de
  origem mudou. A pasta usa o nome da tarefa logica `ide_task`.
- `ide_wait` e o unico no que pode interromper: para manual ou headless
  skipped. Na retomada, somente le e valida output.json com o schema salvo.
  Nao grava prompt, schema, context, output, logs ou recibos; nao chama CLI.
  Headless concluido e pass-through para o resultado salvo.
- Escrita da fixture, logs finais e auditoria ocorrem no chamador CLI, fora
  do no com interrupt. O historico nao e adulterado para simular contagens.
- A protecao cobre a retomada apos o checkpoint de ide_prepare. Um crash
  no meio de uma CLI antes desse checkpoint ainda pode exigir reconciliacao;
  este spike nao promete execucao externa exactly-once em qualquer falha.

`graph.getStateHistory` lista checkpoints/tarefas logicas, nao cada entrada
no corpo de uma funcao. O no ide_wait tem uma tarefa logica, mas entra duas
vezes no ciclo manual. Para comprovar ambas as propriedades, exportamos:

```text
checkpoint-history.paused.json       getStateHistory antes do resume
checkpoint-history.before-resume.json  adicional no resume por CLI externo
checkpoint-history.json              getStateHistory depois do resume
node-executions.json                 eventos debug/task reais, fora dos nos
```

O teste verifica nos eventos **ide_prepare ×1 e ide_wait ×2**, reabrindo o
SQLite antes de retomar, e compara conteudo/mtime de prompt, schema, log e
output. Contar so o snapshot final de getStateHistory nao mede reentradas.

## Contrato e ioMode

```text
runs/<threadId>/ide/ide_task/<attempt>/
  prompt.md
  context/       copias numeradas dos contextFiles
  schema.json
  output.json
  run.log        comando/argv/cwd, stdout/stderr integrais, exit e validacao
runs/<threadId>/checkpoint-history*.json
runs/<threadId>/node-executions.json
runs/smoke-last-results.json
```

`IdeTask.ioMode` aceita `file | stdout`. Padrao: stdout para Antigravity,
file para Codex/manual. No modo file, o prompt encerra com o contrato de
escrita de output.json. No stdout, encerra com a instrucao de responder
apenas JSON, sem markdown; o driver persiste a resposta em disco.

O helper do driver Antigravity le contextFiles localmente e insere blocos
`file path=...` no prompt, junto com o schema completo. O limite acumulado
configuravel e `contextLimitBytes`, padrao **204800 bytes (200 KiB)**. Acima
disso, a preparacao falha com contagem e limite explicitos antes de spawn.
No Windows ha ainda um limite conservador de 24000 caracteres de prompt
para argv; se excedido, o driver retorna erro claro, sem truncar contexto.
O limite de contexto nao elimina o limite de linha de comando do sistema.

Uma resposta invalida de CLI recebe 1 retry em attempt+1 com os erros AJV no
novo prompt. Timeout nao reexecuta automaticamente: SIGTERM/SIGKILL em
POSIX, taskkill /T e depois /F no Windows. O padrao e 10 minutos por chamada,
mais preflight/git diff. JSON valido prevalece sobre exit code nao zero;
timeout impede sucesso. Outputs antigos sao arquivados antes de novo spawn.

## Antigravity: flags e permissoes verificadas

Ajuda completa executada: `agy --help`.
Binario: `C:\Users\brend\AppData\Local\agy\bin\agy.exe`.
Flags relevantes realmente disponiveis:

```text
-p / --print
--output-format text|json|stream-json
--input-format text|stream-json
--json-schema
--mode accept-edits|plan
--print-timeout
--disable-slash-commands
--sandbox
--dangerously-skip-permissions
```

Nao ha --yolo, --allowed-tools, --permission-mode ou --auto-approve na ajuda.
A unica flag encontrada que aprova todas as ferramentas e a ultima acima;
ela nao e necessaria para o transporte stdout e nao foi usada.

Investigacao de settings, sem alterar arquivos globais:

- `~/.antigravity/`: extensions/ e argv.json; sem settings.json.
- `~/.agy/`, `~/.config/agy/`, `~/.config/antigravity/`: nao encontrados.
- `%LOCALAPPDATA%/agy`: sem arquivos de settings/config/permissoes encontrados.
- `%APPDATA%/Antigravity/User/settings.json`: preferencias de editor; nenhuma
  politica permissions/allow/read_file/write_file.
- `~/.gemini/settings.json`: security contem auth; nenhuma politica de tools.
- `~/.gemini/antigravity/`: user_settings.pb e antigravity_state.pbtxt, sem
  schema publico de allow-list identificado; nao foram editados/decodificados.

A falha anterior informava que read_file foi auto-denied em headless, e
mencionava permissions.allow em settings.json, sem identificar um caminho.
Nao encontramos uma allow-list aplicavel nos JSON verificados. Nao foi
necessario enfraquecer permissoes: o modo stdout passou o prompt inteiro em
argv, e a IDE respondeu sem ferramentas de arquivo.

Comando efetivo (argv, shell:false):

```text
agy -p <conteudo integral de prompt.md> --output-format json --mode plan --disable-slash-commands --print-timeout 600s
```

O stdout real e um envelope com `status: SUCCESS` e `response` contendo uma
string JSON. O parser tambem trata result/content/text e blocos de texto,
respeita strings com chaves/escapes e ignora envelopes vazios de telemetria.
O driver grava o objeto e o valida com AJV; o runner confirma o contrato.
gitDiffStat armazena git diff --stat antes/depois (arquivos rastreados).

## Codex: flags e isolamento de configuracao

`codex --version`: **codex-cli 0.152.1** apos atualizar pelo npm.
`codex exec --help` confirmou:

```text
--sandbox read-only
--output-schema <FILE>
-o / --output-last-message <FILE>
--json
--ephemeral
--ignore-user-config
-c / --config <key=value>
```

O config global contem `service_tier = "default"`. O conjunto minimo usado
para nao depender desse config e `--ignore-user-config -c approval_policy="never"`.
Nao se passa service_tier; auth continua usando o CODEX_HOME existente.
O sandbox e explicitamente read-only. Nao se usa --ignore-rules nem bypass
de sandbox/permissoes. Sem --ignore-user-config, o driver retorna SKIPPED
com instrucao de atualizar a CLI.

O primeiro teste apos atualizar retornou JSON estruturalmente valido dizendo
que a politica de execucao bloqueou a leitura do prompt. Esse teste nao foi
aceito como evidencia de revisao. O driver passou a embutir o conteudo do
prompt no argumento, mantendo as regras e o sandbox intactos.

Comando efetivo (argv, shell:false):

```text
codex exec --sandbox read-only --output-schema <schema.json> --json --ignore-user-config -c approval_policy="never" --ephemeral -o <output.json> <conteudo de prompt.md + instrucoes de transporte>
```

A CLI escreve a resposta final por -o; o agente nao precisa escrever no repo.
No Windows, o driver resolve o JS instalado pelo shim npm e executa Node
com argv, sem cmd.exe ou interpolacao de comandos. Para versoes sem -o, o
fallback so extrai o JSON de item.completed/agent_message, nunca telemetria.

Cota/autenticacao/CLI indisponivel resultam em SKIPPED e depois interrupt
para fallback humano, mantendo o motivo original no estado e nos logs.

## Referencias e evidencias

- [Relatorio e tabelas reais](../PHASE0-REPORT.md#fase-01)
- [Semantica oficial de interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
- [Referencia do Codex](https://learn.chatgpt.com/docs/developer-commands?surface=cli)

As divergencias remanescentes estao explicitadas no relatorio: contagem de
reentradas exige eventos, argv tem limite no Windows, e a atualizacao global
da CLI e a excecao de escopo expressamente pedida no item C.1.
