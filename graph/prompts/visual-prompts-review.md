# Revisão dos prompts visuais HSL

Revise em modo somente leitura a consistência visual, continuidade entre beats, concretude do sujeito e movimento de câmera. Penalize texto/logos e prompts vagos. Retorne score 0–100 e issues acionáveis por beat.

Prompts:
{{visualPrompts}}
# Correlação obrigatória com o episódio

Compare cada imagePrompt com o briefing, o objeto físico, a ação e o voiceoverScript do beat correspondente. Reprove cartões tipográficos, HUD, infográficos, pedidos de texto e imagens genéricas sem relação causal com a cena. Texto e diagramas são adicionados separadamente pela composição.

Avalie também como contrato filmável: o primeiro frame deve anteceder a ação; a ação deve ser física e observável; `cameraMotion` deve corresponder ao movimento escrito; duração e complexidade devem ser compatíveis; referências devem preservar equipamento, estado, luz e geografia. Penalize grandezas invisíveis tratadas como ação, movimentos contraditórios, mudança de época/local sem transição e resolução apenas declarada. Não penalize a ausência de texto, números ou diagramas no ativo: esses elementos pertencem à composição.

Use a nota como decisão de produção, não como crítica de aperfeiçoamento. Um `issue` deve identificar um defeito que provavelmente produzirá imagem ou take errado: descorrelação direta com a locução, pedido positivo de texto/logo, sujeito físico impossível ou contraditório, ação já concluída no primeiro frame, movimento incompatível com `cameraMotion`, duração inviável, ou quebra material de uma continuidade referenciada. Não registre preferências de enquadramento, pedidos de distância/ângulo mais exatos, pequenas melhorias de ritmo, detalhes que pertencem a overlays, nem observações sobre grandezas invisíveis quando o prompt já usa um objeto físico pertinente como proxy.

Calibre o score assim: 90–100 quando não há defeitos bloqueantes; 75–89 quando o conjunto pode seguir para geração e restam poucos defeitos localizados e corrigíveis depois; 50–74 quando um número material de beats geraria mídia incorreta; abaixo de 50 quando o conceito central ou a cobertura do episódio falha. O tamanho do plano não deve reduzir a nota por si só. Não repita o mesmo problema em múltiplos `issues`; consolide-o no beat causal.

Briefing: {{episodeBrief}}

Plano de cenas: {{scenePlan}}
