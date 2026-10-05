# Reparo dirigido de prompts visuais (HSL & BRECHA)

Corrija exclusivamente os beats listados em `affectedBeatIds`. Retorne exatamente um item para cada ID listado, sem incluir nenhum outro beat. Copie `beatId` e `durationSeconds` do plano afetado e use `firstFrameFrom: "image"`.

Cada observação da revisão é um defeito bloqueante. Corrija literalmente a causa indicada.

### Diretrizes de Reconstrução do Prompt:
- Todo `imagePrompt` corrigido deve adotar a estrutura cinematográfica em 6 blocos:
  1. `[Lente & Enquadramento]`: 35mm/50mm macro, profundidade de campo rasa f/1.8–f/2.8, 16:9, grão sutil de película.
  2. `[Sujeito & Ação Física]`: Objeto protagonista tangível no estado exato anterior à ação, em ambiente real.
  3. `[Telas, Textos & Interfaces Diegéticas - Isolamento por Canal]`: Telas, mostradores e documentos DEVEM conter textos exatos entre aspas no idioma do canal em produção:
     - **Canal HSL:** Textos estritamente em **INGLÊS TÉCNICO** (ex: "SYSTEM PRESSURE // 180 BAR", "COLD CHAIN LOG // TEMP: +2.8°C"). Proibido terminantemente palavras em português.
     - **Canal BRECHA:** Textos estritamente em **PORTUGUÊS BRASILEIRO** (ex: "Transferência Pix de R$ 4.850,00 enviada", "INSIRA OU APROXIME O CARTÃO").
     - Proibido em ambos apenas cartões de título gráficos flutuantes ou legendas soltas de pós-produção.
  4. `[Iluminação Física & Diegética]`: A luz emitida pela tela rebatendo em superfícies e dedos, iluminação ambiente neutra e sombras de oclusão suaves.
  5. `[Materiais & Microtexturas]`: Texturas palpáveis (fórmica, plástico ABS fosco, vidro com micro-reflexos, papel térmico serrilhado).
  6. `[Paleta & Atmosfera Documental]`: Carvão (`#0D0D0F`), osso (`#E8E2D7`), cinzas minerais e coral pontual (`#FF5A47`).
- O `videoPrompt` deve partir estritamente do primeiro frame e mostrar uma única ação física observável.
- `cameraMotion` deve concordar literalmente com o movimento descrito.
- Preserve equipamento, estado, luz, geografia e convenções visuais dos prompts atuais referenciados.
- Preencha `negative` com exclusões pertinentes (marcas d'água, textos flutuantes, render 3D plástico, etc.) e `continuityRefs`.

Canal e Diretiva de Idioma: {{channelContext}}

IDs obrigatórios: {{affectedBeatIds}}

Plano dos beats afetados: {{affectedScenePlan}}

Prompts atuais completos para continuidade: {{currentPrompts}}

Problemas bloqueantes a corrigir: {{reviewIssues}}

Briefing: {{episodeBrief}}

