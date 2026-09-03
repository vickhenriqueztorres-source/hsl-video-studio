# Importação dos agentes de som para o LangGraph

Implementado em 2026-09-03 a pedido do usuário. O projeto contém cópias físicas;
a execução não depende da pasta original no OneDrive.

## Código, skill e banco

Os módulos `sfx-agent/`, `sound-agent/`, `music-agent/`, o runtime
`hsl/postproduction/soundFxRuntime.ts`, o catálogo Kenney, scripts e testes
foram comparados com o projeto de origem. Os módulos idênticos já estavam
presentes no checkout. Os arquivos diferentes foram preservados como snapshots
em `graph/audio/source-snapshot/`, mantendo os aprimoramentos locais ativos.
O inventário por arquivo, com hash da origem e ação, está em `AUDIO-IMPORT.json`.

As cinco configurações de agentes gerais foram preservadas como referência,
sem ativar regras visuais de outro canal. A receita de áudio do leite foi
copiada como referência; seu plano pode ser reproduzido aqui sem importar o
pipeline visual do outro projeto. A skill completa e seu contrato foram copiados
para `.agents/skills/hsl-soundfx-design/`.

| Material importado para assets/audio-library | Itens |
|---|---:|
| Fontes Kenney: 3 OGG e manifesto | 4 |
| Derivados PCM estéreo: snap, strike e chapter drop | 3 |
| Leite: plano, QA, WAV e 3 MP3 (SFX/música/room tone) | 6 |
| Plano do leite com caminhos portáteis do banco local | 1 |
| Total importado, com SHA-256 conferido | 14 |

São 101.290.552 bytes importados. O banco completo, incluindo o índice e uma
música preexistente, contém 16 arquivos / 104,212 MiB. Não foram encontrados
os 200+ efeitos esperados pelo antigo teste de catálogo: o material aprovado
da origem realmente usa três derivados Kenney. Os beds do episódio são exemplos,
não são sobrepostos automaticamente a outros roteiros.

## Integração

`sfx_render` chama um worker isolado com input/result JSON. O worker importa os
agentes reais do runtime local, lê o banco e verifica os SHA-256 das fontes e dos
derivados. SoundFxDesignAgent planeja a partir dos beats, capítulos, texto narrado
e cues temporizados do audio-plan; SoundFxMixAgent aplica o tratamento original;
SoundFxQaAgent verifica áudio e assets. Um guard adicional limita a densidade a
três cues por segundo. Camadas não suportadas continuam visíveis em sfxUnresolved.

O runtime recebeu somente um contrato menor de entrada (SoundFxScene) e injeção
opcional dos processos. A lógica de design, filtros, mix e QA permanece a mesma.
Chamadas antigas continuam usando os defaults anteriores. O grafo injeta
`graph/lib/proc.ts`, com shell:false, executáveis resolvidos e janelas ocultas.
O filtergraph vai por arquivo, não como conteúdo grande em argv.
Esta edição aditiva no runtime está fora da lista de arquivos da Fase 2.5;
faz parte do pedido posterior de integrar os agentes de som. O orquestrador
de referência não foi alterado.

O cache exige assinatura do plano/runtime/worker e hashes do WAV e do plano.
Hash incorreto no WAV força novo mix; hash incorreto no banco bloqueia antes do
mux. O resultado só é publicado após QA. Retomadas restauram também resolved e
unresolved, evitando o antigo skip baseado apenas em áudio existente.
O estado inclui sfxPlanPath e sfxQaPath; archive_audio/archive_compliance salvam
esses documentos como tier save, que nunca é elegível a prune.

## Validação

`npm run hsl:audio:test` passou em sete verificações com FFmpeg real:

1. Nó LangGraph real: 10 s, estéreo 48 kHz, três cues em 1 / 5,04 / 7 s.
2. Cache preserva o WAV e restaura os cues no estado.
3. WAV adulterado é detectado e renderizado novamente.
4. Asset adulterado é recusado antes do mux.
5. Densidade excessiva é recusada.
6. Plano e QA entram no archive como save.
7. Replay do leite: 18 cues, 360 s, PCM idêntico ao original.

SHA-256 do PCM do leite:
`dc0b6466c70e7b880d205f5c6d5840bd06675a2ad2d013f53a4d0c941aaca1e3`.
Evidência em `AUDIO-VALIDATION.json`. TypeScript e as suítes do grafo das Fases
1, 2 e 2.5 passaram. O teste legado `test:sfx` não faz parte desse resultado:
ele exige o catálogo amplo de 200+ arquivos que não existe na origem.
Isso verifica a faixa SFX; não equivale a uma revisão perceptual do mux completo
com narração e música. Nenhuma geração Kling foi executada.

## Comandos locais e Drive

```powershell
npm run hsl:audio:test
npm run hsl:storage:library -- --scan
npm run hsl:storage:library -- --upload
npm run hsl:storage:library -- --verify
```

Upload e verificação independente concluídos: **16/16 arquivos, 104,212 MiB**,
todos com MD5 remoto igual ao local, zero pendências e zero divergências.
O comando separado da biblioteca arquiva em `02_ASSETS_LIBRARY/`, usa o OAuth
e folder ID configurados por env e mantém `runs/.storage/library/storage-index.json`.
Upload e verify exigem MD5 remoto igual ao local. Este comando não oferece prune;
a biblioteca fica local e no Drive. A migração por episódio continua excluindo
`assets/audio-library/`. Os aliases pedidos `hsl:sfx-agent`, `hsl:sfx-sync` e
`test:sfx` estão presentes; o agente legado não é executado automaticamente,
pois ele também baixa packs e sintetiza um catálogo diferente do aprovado.
