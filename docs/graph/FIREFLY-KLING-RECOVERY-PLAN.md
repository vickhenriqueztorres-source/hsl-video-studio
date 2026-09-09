# Plano de recuperação transacional Firefly/Kling

## Objetivo

Concluir takes Kling sem duplicar gerações pagas quando a Adobe demora para habilitar a exportação, muda a interface ou encerra o worker após um resultado parcial.

## Invariantes

1. Uma autorização aprova um conjunto imutável de `operationId`, `recipeHash` e hash do primeiro frame.
2. Após o primeiro clique em **Gerar**, a operação nunca retorna a `unstarted` por inferência.
3. Um arquivo MP4 só entra no pipeline após recibo de transporte, hash, `ffprobe` e QA visual.
4. Um erro de exportação jamais cria uma segunda geração. Ele só pode iniciar reconciliação do mesmo resultado externo.
5. Uma geração adicional exige novo orçamento explícito e é registrada como operação distinta.

## Contrato do agente externo

O agente Firefly precisa expor um contrato versionado, consultável sem abrir navegador, com:

- `probe-session`;
- `enqueue` e `run` com uma tentativa por operação;
- `recover-result-ready-job`;
- `recover-running-job`;
- exportação de manifesto com `providerJobId`, `generationIntentAt`, estado externo, URN/ID de resultado, URL de rendição e hash do arquivo baixado.

O estado `result_ready` só é válido quando o botão **Baixar** estiver visível e sem `aria-disabled` e sem `disabled`. Enquanto a tela disser **Gerando vídeo**, o worker deve manter a aba e o job ativos, com polling limitado e diagnóstico de rede.

## Estados do recibo

| Estado | Evidência obrigatória | Próxima ação permitida |
| --- | --- | --- |
| `unstarted` | nenhum clique e nenhum job externo | envio único autorizado |
| `generation_submitted` | clique confirmado e `providerJobId` persistido | monitorar ou recuperar o mesmo job |
| `result_identified` | URN/ID único associado à operação | baixar o mesmo resultado |
| `transport_complete` | MP4, SHA-256 e manifesto do agente | `ffprobe` e QA |
| `validated` | QA e duração aprovadas | reutilização determinística |
| `uncertain` | evidência incompleta | gate de reconciliação; nunca reenviar |

## Alterações na raiz do LangGraph

1. Evoluir `graph/production/lib/firefly/process.ts` para exigir o contrato versionado e persistir `generation_submitted` antes do retorno do agente.
2. Trocar a recuperação baseada apenas em screenshot por reconciliação por `providerJobId`/URN e manifesto assinado por hash.
3. Manter `firefly_recovery_wait` como aresta condicional: com `fireflyIssue`, permanece no gate; sem issue, avança a `firefly_dispatch`. Essa proteção já está em vigor.
4. Registrar no ledger se uma operação consumiu uma tentativa, separando-a de um MP4 validado.
5. Adicionar testes de regressão para botão visível porém desabilitado, render ainda em andamento, recuperação por job externo e proibição de segundo clique.

## Recuperação do EP006

O take `SCENE_005-take-1` foi enviado uma vez, com `attempts=1` e `generation_started_at` persistido. Ele permanece `uncertain`, sem MP4 local. A tentativa de recuperação de 8 de setembro confirmou que a sessão Adobe expirou; não criou job nem incrementou tentativas.

O grafo agora encaminha essa situação para `FIREFLY_LOGIN`, preservando o recibo. Após autenticar o mesmo perfil, `recover-running-job 1` pode apenas procurar e exportar o job já enviado. A raiz só promove o take a `transport_complete` quando o manifesto retornar o mesmo id, nome, caminho, SHA-256 e `media_validation_status=PASS`.

Se a Adobe não apresentar um resultado verificável, o episódio continua no gate. Uma substituição é uma nova geração e exige orçamento explícito adicional; ela nunca é disparada pelo mecanismo de recuperação.

## Verificação executada

- build TypeScript da raiz;
- teste do adaptador para recuperação de job em execução, verificando que não chama `--run`;
- teste isolado do agente que prova que a recuperação não inicia geração;
- execução real não paga de recuperação do job 1: `generate_clicked=false`, `attempts=1`, bloqueada somente por login Adobe.
