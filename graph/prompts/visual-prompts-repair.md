# Reparo dirigido de prompts visuais (HSL & BRECHA)

Corrija exclusivamente os beats listados em `affectedBeatIds`. Retorne exatamente um item para cada ID listado, sem incluir nenhum outro beat. Copie `beatId` e `durationSeconds` do plano afetado e use `firstFrameFrom: "image"`.

Cada observação da revisão é um defeito bloqueante. Corrija literalmente a causa indicada. O `imagePrompt` deve ser um primeiro frame fotorrealista 16:9 anterior à ação. O `videoPrompt` deve partir desse frame e mostrar uma única ação física observável. `cameraMotion` deve corresponder ao movimento escrito. Preserve equipamento, estado, luz, geografia e convenções visuais dos prompts atuais referenciados.

Não peça texto, letras, números, logotipos, placas legíveis, diagramas, HUD ou overlays no ativo. Graduações físicas sem caracteres são permitidas. Não represente grandezas invisíveis como efeitos mágicos; use instrumento, indicador, atuador ou mudança material pertinente. Não conclua no primeiro frame a ação que o vídeo deve executar.

IDs obrigatórios: {{affectedBeatIds}}

Plano dos beats afetados: {{affectedScenePlan}}

Prompts atuais completos para continuidade: {{currentPrompts}}

Problemas bloqueantes a corrigir: {{reviewIssues}}

Briefing: {{episodeBrief}}
