# HSL Matrix Console

A Matrix Console é a central local, somente leitura, para observar o grafo de produção. Ela lê o checkpoint SQLite, manifests e índices de mídia; nenhuma operação do pipeline pode ser iniciada na interface.

## Abrir

No Windows, dê dois cliques em `HSL-MATRIX.cmd` e escolha `1`, ou execute:

```powershell
npm.cmd run hsl:matrix
```

Para abrir o painel diretamente:

```powershell
npm.cmd run hsl:dashboard
```

O painel fica em `http://127.0.0.1:2030` e só escuta na máquina local.

## Matrix CLI

A CLI possui menu guiado e comandos diretos:

```powershell
npm.cmd run hsl:matrix -- novo
npm.cmd run hsl:matrix -- sugerir
npm.cmd run hsl:matrix -- continuar
npm.cmd run hsl:matrix -- status
npm.cmd run hsl:matrix -- imagens
npm.cmd run hsl:matrix -- episodios
npm.cmd run hsl:matrix -- temas
npm.cmd run hsl:matrix -- mapa
npm.cmd run hsl:matrix -- kling
npm.cmd run hsl:matrix -- doctor
```

`kling` executa o fiscal técnico sem consumir geração: valida ambiente, perfil, sessão e o último canário físico. O canário pago é um comando separado, exige `HSL_ALLOW_PAID_FIREFLY_DISPATCH=true` e usa recibo idempotente para impedir envio duplicado.

Os modos de teste e produção pedem as palavras `TESTAR` ou `PRODUZIR` antes de passar a autorização ao processo do grafo. Uma retomada posicionada na fase Kling pede `KLING`. O nó de despacho não usa retry genérico: falhas geram `FIREFLY_RECOVERY` com o caminho do recibo e exigem reconciliação, sem reenfileirar um take incerto.

`novo` mostra três pautas inéditas. Digite apenas `1`, `2` ou `3`: a CLI cria o próximo ID (`HSL_EPISODE_NNN`), aplica automaticamente um título em inglês segundo o padrão editorial do canal e preenche os campos técnicos da pauta. O modo recomendado executa somente roteiro e prompts e para antes de gerar imagens ou consumir Kling.

## Catálogo antirrepetição

O catálogo é reconstruído a partir de `runs/*/scene-plan.json`, manifests e vídeos entregues. Temas novos são normalizados e comparados por tokens relevantes em português e inglês. Uma similaridade de 60% ou mais bloqueia a criação e identifica o episódio conflitante. Reservas feitas no assistente ficam em `runs/.catalog/theme-registry.json`, de modo que uma pauta ainda em produção também não volte a ser sugerida.

## O que o painel mostra

- estado e próximo nó do LangGraph;
- fases e nós concluídos, ativos, pulados ou com erro;
- fila de imagens, takes Kling, SFX, render e storage;
- histórico recente e erros do checkpoint;
- artefatos locais disponíveis para pré-visualização;
- saída e histórico das operações iniciadas pela CLI.

## Separação de responsabilidades

- a CLI é a única entrada para iniciar, continuar ou aprovar uma execução;
- o painel visualiza episódios, agentes, checkpoints, mídia e storage;
- requisições HTTP de mutação recebem `405` por projeto;
- arquivos com `driveFileId` abrem diretamente no Drive; coleções abrem a busca do episódio no Drive;
- mídia ainda somente local abre no visualizador interno.
