# Revisão dos Prompts Visuais (HSL & BRECHA)

Revise em modo somente leitura a consistência visual, continuidade entre beats, concretude do sujeito, iluminação física, presença de textos diegéticos em telas/recibos e compatibilidade de movimento de câmera.

Retorne score 0–100 e issues acionáveis por beat.

Prompts:
{{visualPrompts}}

# Critérios de Avaliação e Fidelidade Fotográfica

1. **Estrutura Cinematográfica e Concretude:**
   - O `imagePrompt` deve ser detalhado e ancorado na física: especificação óptica (lente, abertura, profundidade de campo rasa em 16:9), sujeito físico concreto, materiais palpáveis e iluminação física/diegética (luz da tela refletindo na bancada/dedos, sombras de oclusão).
   - Prompts vagos, genéricos (ex: apenas "uma cena industrial" ou "um celular sobre a mesa" sem detalhes de luz e materiais) ou estilizados como desenho/render 3D devem ser penalizados.

2. **Textos e Telas Diegéticas & Conformidade Linguística por Canal:**
   - **Avaliação de Idioma Obrigatório:**
     - **Para o Canal HSL:** Todos os textos diegéticos visíveis em monitores, mostradores analógicos, painéis SCADA, etiquetas de rack e equipamentos DEVEM estar estritamente em **INGLÊS**. Se qualquer prompt do canal HSL contiver palavras em português entre aspas (ex: "PRESSÃO", "ROTA", "TEMPO", "RELATÓRIO"), GERE UMA ISSUE BLOQUEANTE (código: `LANGUAGE_MISMATCH_HSL_REQUIRES_ENGLISH`) para o beat correspondente e penalize severamente a nota.
     - **Para o Canal BRECHA:** Todos os textos diegéticos em smartphones, maquininhas POS, recibos e documentos DEVEM estar estritamente em **PORTUGUÊS BRASILEIRO**. Se houver termos em inglês em interfaces cotidianas brasileiras, GERE UMA ISSUE BLOQUEANTE (código: `LANGUAGE_MISMATCH_BRECHA_REQUIRES_PORTUGUESE`) e penalize a nota.
   - Textos contextuais nítidos entre aspas no idioma correto do canal conferem autenticidade documental máxima.
   - Proibido estritamente em ambos: cartões gráficos de título flutuantes, legendas editoriais soltas, infográficos e HUD flutuante de ficção científica (esses pertencem aos overlays da pós-produção).

3. **Contrato Filmável e Continuidade:**
   - O primeiro frame deve anteceder a ação física.
   - O `videoPrompt` deve descrever uma única ação física observável coerente com a duração.
   - O `cameraMotion` deve concordar literalmente com o movimento descrito (ex: `LOCKED_TELEMETRY` para freeze-frame ou plano fixo; `SLOW_DOLLY_IN` para avanço).
   - Os `continuityRefs` devem manter coerência de sujeito, materiais e ambiente.

4. **Calibragem do Score:**
   - **90–100:** Prompts cinematográficos ricos com estrutura em 6 blocos, ótica precisa, telas/interfaces diegéticas nítidas no idioma exato do canal e sem defeitos bloqueantes.
   - **75–89:** Conjunto sólido e filmável, com poucos detalhes menores corrigíveis sem impedir a geração.
   - **50–74:** Beats com descrições vagas, descorrelação com a narrativa ou comandos contraditórios.
   - **Abaixo de 50:** Conceito visual quebrado, violação de idioma do canal, clichês proibidos (hackers de capuz, neon cyberpunk, chuva Matrix) ou ausência de cobertura do plano.

Canal e Diretiva de Idioma:
{{channelContext}}

Briefing: {{episodeBrief}}

Plano de cenas: {{scenePlan}}


