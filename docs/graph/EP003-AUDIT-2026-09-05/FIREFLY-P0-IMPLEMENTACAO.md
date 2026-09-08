# Firefly P0 — implementação e evidências

O grafo recebeu a correção de planejamento, orçamento, despacho durável e validação de mídia. A homologação externa e uma nova renderização do EP003 permanecem pendentes: o agente Python encontrado nesta máquina não implementa o protocolo exigido. Nenhuma geração paga foi executada nesta validação.

## Resultado do planejamento

O plano original do EP003 contém 58 beats. A projeção `firefly-hybrid` seleciona 14 cenas com movimento motivado, prevê 28 takes de 5 segundos e mantém 10.800 frames a 30 fps (360 segundos). As cenas Firefly ocupam 3.500 frames; os takes são concatenados e cortados à duração de cada cena. Não existe extensão por tela preta ou congelamento implícito.

Evidências: [plano de mídia](firefly-media-plan-preview.json), [timeline projetada](media-scene-plan-preview.json). Esses previews não substituíram o episódio original nem representam vídeos gerados.

## Alterações implementadas

- `media_plan_prepare → media_plan_validate` após a normalização da timeline; contratos de perfil, provedor, motivo do movimento e cobertura exata. Perfil Firefly vazio e combinação Firefly/legado são rejeitados.
- `firefly_guide → kling_budget_wait → firefly_session_prepare`: contagem exata antes de despachar; `maxGenerations=0` continua exigindo autorização. A autorização persistida é vinculada ao plano e ao conjunto de operações.
- Ledger SQLite com reserva transacional antes do efeito externo. Receita vinculada a prompt, plano, modelo e bytes da imagem; recibo vinculado à autorização, à operação e aos hashes de entrada e saída.
- Despacho e `interrupt` em nós separados. Interrupção após possível envio exige reconciliação; output já recebido é validado sem nova chamada. Sem retry genérico no nó pago; lock exclusivo do perfil também protege supervisor e adaptador.
- Retomada CLI com `Command({resume, update})`, mantendo o predicado do orçamento até a decisão ser consumida. `updateState` antes de `resume` descartava a interrupção e foi removido desse caminho.
- QA físico e revisão semântica separados do sucesso do transporte. Vídeos estáticos, pretos, insuficientes ou inconclusivos ficam bloqueados. Evidências de QA e recibos são preservados no arquivamento.
- Provedores `firefly-kling` e `local-ffmpeg` separados. Motor local identificado como `HslLocalMotionVideoEngine`, com alias antigo de compatibilidade; a auto-cura local não satisfaz uma exigência Firefly.
- Gates em junção, pré-render, render, compliance e finalização. `COMPLETED` exige cobertura e recibos atuais do master e do relatório. O manifesto de render registra arquivos efetivamente resolvidos, hashes, provedores e intervalos.
- Caches de props/chunks/visual/master/compliance vinculados ao conteúdo; trocar imagens por vídeos invalida um master anterior de mesma duração. Limite de passos calculado a partir da timeline; checkpoints antigos exigem replanejamento explícito e preservam o ledger.
- Inspeção do protocolo do agente externo por `--help` antes de sessão/despacho. Versões sem `--probe-session` ou `--requeue-unstarted-infra-job` são bloqueadas antes de criar jobs.

## Validação reproduzível

Executar na raiz do projeto:

```powershell
npm run hsl:firefly:test
```

O comando executa TypeScript e as suítes offline de planejamento, ledger, fluxo Firefly, adaptador, supervisor, mídia FFmpeg, identidade de render, fase 2, produção, armazenamento e progresso. O [log desta execução](firefly-p0-regression.log) registra os resultados; sucesso integral termina em `FIREFLY_P0_OFFLINE_REGRESSION_OK`.

Resultado desta execução: **PASS**, código de saída **0**, marcador final confirmado. Planejamento: 13 testes; ledger: 8; fluxo: 35; adaptador: 18 grupos; identidade de render/finalização: 13. As demais suítes listadas também concluíram com sucesso. Não houve chamadas pagas.

Entre os cenários exercitados estão 101 takes no grafo; 137 reservas no ledger; reabertura do SQLite; morte real de subprocesso com worker sobrevivente; perda de checkpoint antes/depois do transporte; autorização divergente; bytes adulterados; sessão inválida; QA rejeitado; vídeos locais apresentados como Firefly; master de mesma duração com mídia antiga; e finalização com recibo desatualizado.

Os testes de geração usam fixtures sem Adobe. Os testes de mídia decodificam e codificam vídeos sintéticos com FFmpeg. Métricas amostradas e revisão semântica não garantem perfeição visual em todas as cenas; a homologação de um take real continua necessária.

## Bloqueio externo comprovado

Agente localizado em `C:\Users\Paulo R Advocacia\Documents\agente studio - brecha\canal-brecha-main\canal-brecha-main\agente firefly`, com Python 3.12.14 e diretório `data\chrome_profile`. A autenticação desse perfil não foi verificada. `HSL_FIREFLY_AGENT_DIR` permanece sem configuração no HSL; não foi apontada automaticamente para uma instalação incompatível.

A execução real de `main.py --help` confirmou a ausência de `--probe-session` e `--requeue-unstarted-infra-job`. A leitura do worker também mostrou `MAX_ATTEMPTS=3` e cálculo `max(MAX_ATTEMPTS, FIREFLY_PROVIDER_CAPACITY_MAX_ATTEMPTS)`: enviar a variável como `1` não limita essa versão a uma tentativa. Existem ainda repetição de clique de geração e reinício pelo watchdog. Portanto, contar uma chamada do adaptador não prova uma única tentativa externa nessa instalação.

[Diagnóstico e hashes dos arquivos externos](firefly-agent-compatibility.json).

Para concluir a homologação:

1. Atualizar/adaptar o agente externo: probe sem geração, reconciliação restrita a jobs comprovadamente não enviados e tentativa externa vinculada à reserva, sem reenvio ambíguo por clique/watchdog.
2. Configurar `HSL_FIREFLY_AGENT_DIR` e `HSL_FIREFLY_CHROME_PROFILE` para essa versão e validar a sessão.
3. Executar um canário de escopo explícito, seguido de continuação, preservando autorização, recibos, QA e render de teste.
4. Criar uma revisão do EP003 com linhagem, reaproveitar somente assets compatíveis e renderizar os 360 segundos após os gates. `resume` do episódio antigo concluído não aplica retroativamente o planejamento novo.

O aceite offline não é homologação no Adobe, e o vídeo anterior não foi corrigido por esta alteração de código. A proteção implementada é bloquear condições inconsistentes de modo auditável, sem declarar Firefly executado quando faltam as evidências.
