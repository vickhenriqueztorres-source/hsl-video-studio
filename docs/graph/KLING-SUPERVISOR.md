# Fiscal do Kling 2.5 Turbo

O `KlingSupervisorAgent` protege a fronteira paga entre o LangGraph e o agente
Firefly. O modelo, duração, resolução, aspecto e áudio são fixos em Kling 2.5
Turbo, 5 segundos, 1080p, 16:9 e áudio desligado.

## Comandos

```powershell
npm.cmd run hsl:kling:check
$env:HSL_ALLOW_PAID_FIREFLY_DISPATCH="true"
npm.cmd run hsl:kling:canary
npm.cmd run hsl:kling:reconcile -- <runtime-do-take> <guide.json>
```

`check` não gera vídeo. O canário utiliza um runtime diário idempotente; repetir
o comando depois de `succeeded` apenas valida o mesmo arquivo.

## Recibo e retry

Cada take mantém `dispatch-receipt.json` com hash do guia e uma destas fases:

- `prepared`: guia validado e primeiro frame copiado para o sandbox;
- `enqueued`: job persistido no SQLite do agente;
- `running`: pode ter ocorrido cobrança;
- `succeeded`: saída física encontrada e pronta para intake;
- `uncertain`: bloqueio fechado; exige reconciliação manual.

O nó pago não recebe o retry genérico do LangGraph. Um erro vira
`FIREFLY_RECOVERY` com o recibo e a regra `manual-reconcile-no-auto-resubmit`.
Somente `enqueued` pode continuar sem novo feed; `prepared`, `running` e
`uncertain` não criam outro job. A saída física permite reconciliar o código 2
do watchdog, que significa fila vazia depois da conclusão.

`hsl:kling:reconcile` é restrito a falhas de infraestrutura comprovadamente
anteriores à geração. O SQLite só aceita a transição `failed-infra -> pending`
quando `generation_started_at` e `output_path` estão vazios. O comando também
confere a identidade e o hash do guia no recibo antes de restaurar a fase
`enqueued`. Assim, o resume reutiliza o mesmo job e nunca executa outro feed.

No incidente `HSL_EPISODE_011/SCENE_001-take-2`, o arquivo chegou ao editor,
mas o seletor global não enxergou a miniatura dentro do Shadow DOM. O agente
agora confirma o upload pelos controles positivos `remove-frame-0`,
“Remover/Substituir imagem” ou equivalentes em inglês, percorrendo os shadow
roots. Prompt, canvas genérico e botão Generate não são aceitos como prova.

O agente externo continua usando SQLite WAL e transições CAS. A tentativa de
capacidade do provedor fica limitada a três. O grafo mantém concorrência 1 e
conta cada take contra `maxGenerations` antes do despacho.

## Gate técnico

O relatório `hsl.kling-health.v1` exige H.264, 1920x1080, aspecto 16:9,
duração mínima de 4,5 s, frame rate válido, arquivo maior que 100 kB e diferença
entre o primeiro e o último quadro. O intake do episódio repete `ffprobe` antes
de marcar o take como concluído.

## Autorização por episódio

O `firefly_guide` considera somente beats `firefly_video`. Depois de verificar
quais MP4 já podem ser reaproveitados, ele interrompe em `KLING_BUDGET` e informa
o número exato de novas gerações. A Matrix CLI solicita `KLING`, grava esse valor
como `maxGenerations` e retoma o mesmo checkpoint. Nenhum processo pago é
iniciado antes dessa decisão.
