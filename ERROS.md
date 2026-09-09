# Registro de erros de produção

## 2026-09-09 — `SCENE_045-take-2` recebeu capacidade indisponível do Kling

**Erro:** o endpoint de geração respondeu HTTP 408 com `system under load` após a intenção de geração ter sido registrada.

**Classificação:** (b) capacidade temporária do provedor externo.

**Causa:** o adaptador externo detectou corretamente `error_toast`, mas a reserva estrita impediu reenfileirar a mesma operação, pois não há prova de que a tentativa não consumiu geração.

**Solução:** o nó de recuperação agora reconhece evidência de rede 408/429/5xx sem MP4 como falha terminal daquela operação, marca somente o take como indisponível e libera cenas independentes. Não há reenvio automático nem nova cobrança para o mesmo `operationId`.

**Validação:** build TypeScript e testes focados de falha terminal e resposta de capacidade aprovados.

## 2026-09-09 — `SCENE_041-take-1` terminou sem mídia após o provedor sinalizar erro

**Erro:** depois de confirmar o clique de geração, Firefly exibiu “Não podemos exibir o vídeo gerado” e o modal de desaceleração “Tente novamente mais tarde”. O agente classificava a página como `unknown` e encerrava como infraestrutura ambígua.

**Classificação:** (b) capacidade do provedor, com lacuna de detecção de estado externo.

**Causa:** o seletor de erro conhecia apenas “Ocorreu um erro”; o painel atual usa a mensagem de vídeo indisponível, alojada no componente de erro do Firefly.

**Solução:** o agente externo agora detecta explicitamente “Não podemos exibir o vídeo gerado”. No LangGraph, evidência terminal sem MP4 marca apenas a operação como `FIREFLY_PROVIDER_TERMINAL_NO_OUTPUT`, preserva o recibo e libera os takes independentes sem reenviar a geração paga.

**Validação:** `firefly_bot/tests/test_selectors.py`: 7 aprovados; `npm run build`; e três cenários focados em `fireflyFlow.test.ts` aprovados, incluindo erro terminal sem saída.

## 2026-09-09 — `firefly_intake_wait` recusou `SCENE_040-take-1`

**Erro:** a cena terminou em redução parcial de iluminação, sem blackout metropolitano completo e sem as reflexões de giroflex vermelho/azul exigidas.

**Classificação:** (a) deriva de evento temporal e iluminação do provedor externo.

**Causa:** Kling não representou nem a transição instantânea de apagão nem o efeito posterior de emergência definidos no prompt e no frame de referência.

**Solução:** o take foi reprovado e isolado; a dependência da cena permanece bloqueada e o recibo impede reenvio ambíguo. A substituição só pode ocorrer sob nova autorização paga.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/48f7cabf18cdd4bedb28ea34ed6b9f4dc31b58d2a787bc11ec79fbab867884e5.mp4.qa.json`; build e teste focado da política de quarentena passaram antes da retomada.

## 2026-09-09 — `firefly_intake_wait` recusou `SCENE_038-take-1`

**Erro:** a transição de status do disjuntor terminou com ambas as lâmpadas acesas, contrariando a extinção contínua da lâmpada vermelha exigida pela cena.

**Classificação:** (a) deriva de estado discreto do provedor externo.

**Causa:** o Kling não preservou a regra de um único estado de iluminação durante a sequência, apesar de entregar mídia tecnicamente válida.

**Solução:** o grafo isolou a operação, bloqueou o take dependente e preservou evidências. Não houve reenvio, alteração do recibo ou consumo adicional para essa operação.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/4534e23c1ca150f68e3c46a7bc46be2b1fe6c82dcde1da0f3e427c5827c72fa9.mp4.qa.json`; o teste de quarentena de QA e a build TypeScript seguem aprovados.

## 2026-09-09 — `firefly_intake_wait` recusou `SCENE_028-take-1`

**Erro:** a QA semântica não confirmou a pequena deflexão ascendente do ponteiro e detectou um feixe vermelho amplo, ausente no frame aprovado, a partir de 2,875 s.

**Classificação:** (a) deriva temporal e de iluminação do provedor externo.

**Causa:** Kling manteve o ponteiro perto do limite baixo e introduziu iluminação vermelha que altera a continuidade óptica da cena.

**Solução:** quarentena do take e do respectivo recibo; dependências seguem bloqueadas e o grafo não poderá reenviar a mesma operação. A cena só poderá receber substituição com nova autorização paga.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/3da2962c350eb10b147f4ce3fcb13ca483b10865b7db6ae231cb3af5d43fd1fc.mp4.qa.json`; build e teste focado de quarentena permanecem aprovados.

## 2026-09-09 — `firefly_intake_wait` recusou `SCENE_023-take-1`

**Erro:** a QA semântica detectou que o ponteiro central se moveu no sentido horário, contrário ao movimento anti-horário exigido para representar a queda até o limiar vermelho.

**Classificação:** (a) deriva temporal do provedor externo.

**Causa:** o MP4 foi entregue com parâmetros técnicos válidos, mas o movimento gerado contradiz o prompt aprovado; a validação semântica impediu que esse take fosse incorporado ao vídeo final.

**Solução:** o take foi colocado em quarentena com recibo e artefatos preservados. Nenhuma nova geração será disparada para a mesma operação; uma substituição requer autorização paga adicional.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/cd9375be502172aad8ac3485790ae212ea82bfd0d739a5ca061709036d968a43.mp4.qa.json` e teste focado de quarentena de QA aprovado.

## 2026-09-09 — `firefly_intake_wait` recusou `SCENE_020-take-2`

**Erro:** o segundo take da cena 020 passou na inspeção técnica, mas a QA semântica identificou movimento do ponteiro no sentido oposto e deformação da carcaça central rígida.

**Classificação:** (a) deriva visual do provedor externo.

**Causa:** a geração Kling não manteve a geometria da máquina nem o vetor temporal solicitado. O take anterior da mesma cena foi aprovado, mas esse take dependente não pode fornecer continuidade segura.

**Solução:** o grafo preservou o MP4 e a evidência, marcou somente este take como reprovado e bloqueou reenvio automático. Uma substituição exige uma nova autorização paga explícita, pois a geração original já foi consumida.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/6031c980bac63401e70aa68148e979bea8bc6ae4d43084a190e4617e9138998d.mp4.qa.json`; a regra de quarentena foi coberta pelo teste focado do fluxo Firefly.

## 2026-09-09 — `firefly_intake_wait` recusou `SCENE_019-take-1`

**Erro:** o take retornou vídeo tecnicamente válido, mas a QA semântica encontrou números e texto espúrios no mostrador, mudança nas marcações e um ponteiro com movimento incompatível com a instrução contínua.

**Classificação:** (a) deriva visual do provedor externo; não é erro de transporte nem de checkpoint.

**Causa:** o Kling alterou detalhes rígidos do mostrador e a trajetória do ponteiro durante a geração. A análise determinística passou, enquanto a revisão semântica reprovou correspondência e continuidade.

**Solução:** `firefly_intake_wait` registrou a reprovação com evidência e colocou somente `SCENE_019-take-1` em quarentena. O roteamento preserva os takes dependentes bloqueados e libera somente cenas independentes já autorizadas; o recibo original não pode ser reenviado automaticamente.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/2073446d432776273abe2765af96d192ac03710d1c5837a8fa87a61bd9959831.mp4.qa.json`. O teste focado cobre a quarentena por QA sem criação de geração substituta.

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

## 2026-09-09 — recuperação de exportação de `SCENE_051-take-1`

**Erro:** o Firefly retornou um MP4 de 21.098.920 bytes, 1920×1080 e 5,04 s, mas o agente encerrou o job com `FAILED_MEDIA_VALIDATION: moov atom not found`. A primeira cópia foi validada enquanto ainda era parcial. Na recuperação, o arquivo parcial antigo `.job_1.incoming.part` também era interpretado como um segundo download e causava `DOWNLOAD_TEMP_RESULT_AMBIGUOUS`.

**Classificação:** (c) sincronização do adaptador externo de exportação.

**Solução:** o adaptador agora exige todas as amostras consecutivas de estabilidade configuradas antes do `ffprobe` e passa os parâmetros de estabilidade do `Config` até a validação. A recuperação ignora o espaço de trabalho interno `.job_*.incoming.part` e considera apenas temporários do Chrome. O download completo foi recuperado sem nova geração paga.

**Validação:** testes do adaptador: `firefly_bot/tests/test_export_flow.py` (15 aprovados) e `firefly_bot/tests/test_selectors.py` (7 aprovados). O MP4 recuperado passou na inspeção técnica; a QA semântica do grafo o reprovou por luzes que não apagam e deformação da máquina, então foi colocado em quarentena sem reenvio.

## 2026-09-09 — `firefly_intake_wait` recusou `SCENE_053-take-1`

**Erro:** o MP4 técnico passou, mas a QA semântica não conseguiu comprovar a pequena estabilização ascendente do ponteiro de pressão nem a rotação contínua do eixo protegido.

**Classificação:** (a) limitação de verificabilidade e deriva temporal do provedor externo.

**Causa:** o Kling entregou movimento de câmera sem evidência visual suficiente das duas ações físicas essenciais solicitadas.

**Solução:** o take foi colocado em quarentena com recibo e QA preservados. O grafo não reenviará a mesma operação e seguirá somente para takes independentes ainda cobertos pela autorização existente.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/f8f01909474e7eca22b6e466d3af3b683d7add5a8f5e73f34f393f547b383be6.mp4.qa.json`; a cobertura de quarentena Firefly e a build serão reexecutadas antes da retomada.

## 2026-09-09 — `firefly_intake_wait` recusou `SCENE_056-take-1`

**Erro:** a QA semântica detectou que o ponteiro atingiu o limite vermelho sem acionar a bandeira de trip; quando a bandeira caiu no último frame, o ponteiro já havia saído do limite.

**Classificação:** (a) contradição temporal do provedor externo.

**Causa:** o Kling não manteve a relação causal exigida entre a deflexão final do instrumento e o acionamento instantâneo da bandeira.

**Solução:** o take foi colocado em quarentena com evidência preservada e sem reenvio automático. Não restam takes independentes cobertos pela autorização original; os seis pendentes dependem de takes reprovados.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/9c964cf30bfba855716e735cc18aa73ea89e4132a1c9f1e3c006f1be82777495.mp4.qa.json`. A build e os testes focados de quarentena foram aprovados antes da última retomada.

## 2026-09-09 — substituição `SCENE_005-take-1` (revisão 1) recusada

**Erro:** a QA semântica detectou alteração de cor de uma lâmpada, em vez do deslocamento mecânico único do indicador exigido pela cena.

**Classificação:** (a) deriva semântica do provedor externo.

**Causa:** a geração substituta preservou a aparência técnica do MP4, mas interpretou o evento físico como iluminação e não como posição mecânica.

**Solução:** a operação substituta `c8d7dceb…` foi colocada em quarentena. O recibo original e o recibo de substituição foram preservados; não houve reenvio. Restam 14 das 15 substituições explicitamente autorizadas.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/c8d7dceb8950ac75dc86c500616bd2bbcbe46cc6d4af8e7e275db45b2581a336.mp4.qa.json`.

## 2026-09-09 — substituição `SCENE_009-take-1` (revisão 1) recusada

**Erro:** a QA semântica detectou que a carcaça direita perdeu as nervuras radiais do frame aprovado e se transformou em uma superfície lisa e arredondada.

**Classificação:** (a) deriva estrutural do provedor externo.

**Causa:** a segunda geração substituta confundiu o movimento do acoplamento com deformação da geometria rígida da turbina.

**Solução:** a operação substituta `ff3151be…` foi colocada em quarentena, mantendo os recibos original e substituto. Nenhum reenvio dessa operação foi realizado. Restam 13 das 15 substituições autorizadas.

**Validação:** evidência em `runs/HSL_EPISODE_006/firefly/takes/ff3151bed4f037f270faf02bfd798ad2cc2a7921e738ecfce8e18cdee6c6649a.mp4.qa.json`.
