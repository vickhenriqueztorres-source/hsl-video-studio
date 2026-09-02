# HSL Video Production Rules [DOCUMENTO HISTÓRICO / LEGADO]

> ⚠️ **AVISO DE DEPRECIAÇÃO:** Este documento reflete protótipos anteriores (ex: voz Voicebox). A autoridade canônica oficial é [`docs/HSL_MASTER_PRD_ARCHITECTURE_BRIEFING.md`](./HSL_MASTER_PRD_ARCHITECTURE_BRIEFING.md) e a especificação executável em [`spec/hsl-spec.ts`](../spec/hsl-spec.ts).

Estas regras sao mantidas apenas para histórico:

## Voz oficial

- A voz oficial do projeto e `Echo`.
- O provedor oficial e `Voicebox`.
- O preset oficial e `am_echo`.
- Nao usar Microsoft TTS, ElevenLabs, fallback local ou outra voz para master final.
- Se `HSL_NARRATION_PROVIDER` nao for `voicebox`, o pipeline deve falhar.

## Configuracao visual original

- Manter o plano cinematografico do canal: maioria Kling/Veo, pouca Remotion.
- Remotion fica apenas para dados, labels e informacao que precisa ser exata.
- Start frames para Kling/Veo precisam ter base foto-real/cinematografica.
- Nao aprovar start frame que seja apenas diagrama escuro, texto grande, grid abstrato ou title card.
- O video final nao deve exibir overlays globais como `HSL DOCS`, `AI VISUALIZATION`, barra de loading ou texto hibrido persistente.

## Contrato visual imutavel

- Versao obrigatoria: `HSL_VISUAL_IDENTITY_V2`.
- Referencia minima obrigatoria: `HSL Premium Motion Reference Set V1`.
- Estetica: fotografia documental cinematografica integrada a infografico espacial Kinetic Pop.
- Amarelo `#FFE500`: somente fluxo ativo.
- Azul `#0038FF`: somente infraestrutura persistente.
- Laranja `#FF2E00`: somente bloqueio, gargalo ou risco.
- Branco `#F4F4F0`: informacao editorial exata adicionada depois da geracao.
- Um assunto dominante e um foco luminoso principal por Start Frame.
- Texto, numero, label, logo e painel legivel nao podem ser gravados no Start Frame.
- Procedural previs, flat vector, placeholder e proxy sao proibidos como fonte de producao.
- Todo frame precisa de `hsl.start-frame.provenance.v2`, hash do prompt e IDs das referencias aprovadas.
- Aprovacao humana fica presa ao hash das contact sheets; qualquer alteracao exige nova revisao.

## Gates obrigatorios

- Cobertura gerada minima: 70%.
- Cobertura Remotion maxima: 22%.
- No maximo um shot Remotion consecutivo.
- Assets locais/proxy sao proibidos no master final.
- Start frame flat deve reprovar no QA antes de ir para Kling/Veo.
- QA de paleta isolado nao prova identidade visual.
- QA somente passa com proveniencia aprovada, contrato de prompt e analise visual.
- O orquestrador deve parar antes da geracao quando a aprovacao humana ou a autorizacao paga estiver ausente.
