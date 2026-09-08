# Matrix: progresso e contas

Na raiz do projeto, execute `npm.cmd run hsl:matrix`.

- **4 — Ver status**: percentual, nó atual, imagens, takes, chunks e motivo da pausa.
- **L — Logs ao vivo**: consulta o checkpoint e os registros a cada 2 segundos. Enter volta ao menu sem parar a produção.
- **A — Contas Codex / Antigravity**: menu para entrar, trocar conta ou verificar conexões dos dois agentes.
- Durante `run` e `resume` pelo Matrix, o monitor aparece automaticamente.
- `npm.cmd run hsl:matrix -- logs HSL_TEST_3MIN_20260903` acompanha um episódio específico.

O observador em http://127.0.0.1:2030 mantém o mapa mental e é somente leitura. A faixa superior mostra progresso e gate; cada agente mostra seu percentual; o painel inferior contém os últimos 80 eventos. O checkpoint e os contadores são atualizados a cada 2 segundos; o acervo completo, a cada 12 segundos. Recolha o painel de logs para ampliar o mapa.

## Significado do percentual

É a fração de nós concluídos no caminho aplicável, com contagem parcial de imagens, takes, lotes de revisão e chunks no nó ativo. Não é uma estimativa de tempo restante. Reexecuções e revisões podem reduzir o percentual. Um nó apenas iniciado não conta como concluído. Um gate interrompido aparece como `WAITING`; um processo encerrado com trabalho pendente aparece como `PAUSED`. `100%` exige `COMPLETED` e nenhum próximo nó.

Checkpoints concluídos antigos podem anteceder novos nós. Nós sem execução registrada nesses checkpoints aparecem como `skipped`, fora da contagem de etapas registradas. Não se infere uma execução que não ocorreu.

O runner grava `runs/<EP>/graph/execution.json` com PID e atividade para distinguir execução de checkpoint parado. `node-events.jsonl` e os timings do checkpoint preservam o histórico; `live.jsonl` acrescenta eventos sanitizados de início, fim, erro, gate e progresso de itens. O leitor usa apenas o final dos arquivos. Telemetria não dispara agentes nem retoma o grafo. Os logs novos ocultam URLs, Bearer tokens e campos comuns de credenciais; não substituem o cuidado dos produtores de logs com segredos.

## Antigravity persistente

### Trocar contas pelo Matrix

Execute `npm.cmd run hsl:matrix -- contas` ou escolha **A** no menu principal:

1. Entrar no Codex.
2. Trocar conta do Codex: encerra o login atual com `codex logout`, depois abre `codex login`. Falha no logout interrompe a troca. Conclua o login com a conta desejada no navegador.
3. Entrar no Antigravity.
4. Trocar conta do Antigravity: abre o TUI nativo com instruções para digitar `/logout` e fazer o novo login. Se o TUI encerrar, escolha a opção 3 para abrir o login novamente. O Matrix não envia `/logout` como prompt ao modelo.
5. Verificar conexões, sem alterar credenciais.

Atalhos: `npm.cmd run hsl:codex:switch` e `npm.cmd run hsl:antigravity:switch`.

Há uma conta ativa por ferramenta no perfil de usuário usado pelo processo. A troca substitui a autenticação das próximas chamadas; não cria um catálogo de tokens nem alterna contas automaticamente. Outras execuções que usam o mesmo armazenamento de credenciais compartilham essa troca. Não faça a troca enquanto houver geração em andamento. O Matrix não altera checkpoints nem retoma episódios ao trocar uma conta.

O navegador pode reutilizar a conta já conectada: escolha **Usar outra conta** no login oficial. Credenciais continuam sob o gerenciamento nativo das ferramentas; consulte a [autenticação oficial do Codex](https://developers.openai.com/codex/auth/) e a [autenticação oficial do Antigravity](https://www.antigravity.google/docs/cli/install/).

Validação da troca: TypeScript, menu interativo e testes com comandos de login/logout simulados (`ts-node graph/ide/codexAccount.test.ts`). Nenhuma sessão real foi desconectada para testar a opção.

`npm.cmd run hsl:antigravity:status` consulta `agy models` usando a sessão existente. `CONNECTED` significa que a sessão conseguiu consultar os modelos, não que tenha cota ilimitada para geração.

`npm.cmd run hsl:antigravity:login` abre o TUI oficial do `agy`, que inicia o login no navegador se necessário. Ao terminar, use `/exit` para voltar. O Matrix entrega o terminal ao processo nativo e o recupera depois. Não existe um subcomando `agy login` nesta versão.

O Antigravity conserva a sessão no cofre de credenciais do sistema e a reutiliza em chamadas posteriores, inclusive pelo driver headless do grafo, sob o mesmo usuário do Windows. Não há token copiado para `.env`, estado ou repositório. Ver [documentação oficial do Antigravity CLI](https://www.antigravity.google/docs/cli/install/).

## Validação em 2026-09-03

- TypeScript: `tsc --noEmit`.
- `npm.cmd run hsl:console:test`: contadores, execução/pausa, gates, retry, conclusão, sanitização, API e bloqueio de POST.
- Suíte de produção: idempotência, gates, retomada e argumentos Windows.
- `npm.cmd run hsl:matrix` testado em terminal interativo; menu L acompanha o teste de 3 minutos e Enter retorna ao menu.
- Antigravity real respondeu `CONNECTED` via CLI, sem nova autenticação.
- Painel conferido no navegador: teste de 3 minutos em 32%, 29/29 imagens, gate `IMAGE_HUMAN_REVIEW` por falta de cota do Codex. Nenhuma geração foi disparada nesta alteração.
