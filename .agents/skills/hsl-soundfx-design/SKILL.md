---
name: hsl-soundfx-design
description: Planeja, produz, aplica e valida sound effects narrativos durante a edicao e pos-producao de episodios do Hidden Systems Lab. Use quando houver contratos de cena aprovados e for preciso construir ou revisar a faixa de SFX; nao use para trilha musical, voz ou geracao visual.
---

# HSL Sound FX Design

Atue depois da aprovacao do plano de execucao e antes do render final. Leia os contratos de cena, a timeline e a narracao; transforme apenas eventos narrativamente motivados em cues de SFX.

## Regras

- Preserve a narracao como elemento dominante. SFX devem pontuar, nao disputar atencao.
- Use silencio quando nao houver funcao narrativa clara. Nao sonorize cada animacao.
- Sincronize `SNAP_POP` com setas e fluxos cineticos, `SUBTLE_STRIKE` com alertas ou gargalos e `CHAPTER_DROP` com mudancas de capitulo.
- Priorize o catalogo Kenney CC0 sincronizado pelo projeto. Nunca extraia audio da referencia editorial.
- Se o cache Kenney estiver ausente ou com hash divergente, execute `npm run hsl:sfx-sync`; nao substitua silenciosamente por audio sintetico.
- Registre cue, cena, frame, tempo, ganho, motivo, origem e SHA-256 no plano.
- Gere uma faixa SFX estereo em 48 kHz e valide duracao, canais, densidade de cues e hashes antes de liberar o Remotion.
- Mantenha a regra de ducking musical em `-18 dB` durante narracao; ela pertence ao mix musical, mesmo quando registrada no mesmo plano.

Para contratos, gates e entregaveis, leia [references/hsl-soundfx-contract.md](references/hsl-soundfx-contract.md).
