# Registro de erros de produção

## 2026-09-08 — `firefly_dispatch` classificou render em andamento como resultado pronto

**Erro:** o primeiro take do EP006 foi enviado ao Kling 2.5 Turbo, mas o agente tentou exportá-lo enquanto a tela ainda exibia “Gerando vídeo…”. O botão `Baixar` estava desabilitado e a execução terminava em `RESULT_READY_DOWNLOAD_BUTTON_DISABLED`.

**Classificação:** (c) detecção de estado externo e roteamento de recuperação.

**Causa:** o seletor de `RESULT_READY` excluía apenas `aria-disabled="true"`; a interface atual também usa o atributo nativo `disabled`. Isso permitia classificar como pronto um botão visível, porém inativo. Além disso, uma aresta estática enviava um recibo ainda incerto de `firefly_recovery_wait` de volta a `firefly_dispatch`.

**Solução:** o agente Firefly configurado nesta máquina agora exige simultaneamente ausência de `aria-disabled` e de `disabled` antes de permitir exportação. No grafo, `routeRecovery` mantém o checkpoint em `firefly_recovery_wait` enquanto `fireflyIssue` existir; só retorna ao despacho depois da reconciliação comprovada. A recuperação não reenfileira nem cria uma nova geração.

**Validação:** captura real confirma que o vídeo ainda estava em geração; teste de seletores do agente: 7 aprovados. `npm run build` e o fluxo focado `graph/production/__tests__/fireflyFlow.test.ts` foram executados com sucesso.

## 2026-09-08 — Cofre ElevenLabs

**Erro:** a nova credencial recebida para narração respondeu `HTTP 401` na consulta somente leitura da assinatura.

**Classificação:** (b) credencial de ferramenta externa.

**Causa:** a API rejeitou a chave antes de qualquer síntese de áudio.

**Solução:** a chave foi protegida temporariamente pelo cofre DPAPI local, validada sem gerar áudio e removida após a recusa. A chave ativa anterior foi restaurada e validada; o pipeline continua usando-a. Nenhum segredo foi gravado neste registro, em logs ou no repositório.

## 2026-09-08 — `visual_prompts_review_wait`

**Erro:** `VISUAL_PROMPTS_REVIEW_FAILED: score=64, threshold=75` encerrava a execução após duas revisões.

**Classificação:** (c) lógica do agente.

**Causa:** o nó lançava exceção na segunda nota abaixo do limiar. O roteador nunca recebia a oportunidade de corrigir os prompts nem de preservar uma decisão humana auditável.

**Solução:** `GraphOptions.promptReviewMaxIterations` estabelece um orçamento limitado de revisões (padrão: 6; máximo: 12). Ao esgotá-lo, o nó cria o gate `VISUAL_PROMPTS_HUMAN_REVIEW`, com score, problemas e caminho do artefato. O comando `resume --decision retry --prompt-review-attempts N` estende o orçamento sem liberar prompts reprovados; `proceed` fica registrado como aprovação humana explícita.

**Validação:** build TypeScript e `graph/production/__tests__/phase2.test.ts` aprovados. O EP006 passou por seis revisões reais sem stack trace e preservou o checkpoint no gate.

## 2026-09-08 — `visual_prompts_prepare`

**Erro:** correções sucessivas do revisor alteravam novamente beats já aceitos; a nota global oscilava e não convergia.

**Classificação:** (c) lógica do agente.

**Causa:** toda nova tentativa regenerava os 58 prompts, embora a revisão apontasse apenas um subconjunto de cenas. Isso reintroduzia inconsistências de continuidade e ação inicial em cenas que não haviam falhado.

**Solução:** a partir da primeira revisão baixa, o nó usa `graph/prompts/visual-prompts-repair.md`, exige retorno exatamente para os `beatId`s reprovados, valida duração e `firstFrameFrom`, e mescla os patches sobre a versão anterior. Se o retorno não cobrir exatamente os IDs solicitados, o provedor é recusado e o checkpoint não avança silenciosamente.

**Fallback:** se o revisor ou o reparador não produzir resposta válida, o grafo preserva o checkpoint no gate de revisão humana; imagens e Firefly não são iniciados.

**Validação:** build TypeScript e `graph/production/__tests__/phase2.test.ts` aprovados após o reparo dirigido.
