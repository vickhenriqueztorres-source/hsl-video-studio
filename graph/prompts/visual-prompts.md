# Direção visual de Produção (HSL & BRECHA)

Crie prompts para cada beat do plano JSON abaixo respeitando as diretrizes do canal especificado:
- **Canal BRECHA** (documentário de defesa cotidiana e investigação forense brasileira):
  - **Ambientes reais cotidianos brasileiros:** cozinha, quarto, portaria, carro no trânsito, loja, ônibus, calçada, escritório. A ameaça entra na vida real, nunca em um "laboratório hacker".
  - **Objetos tangíveis reconhecíveis:** celular, cartão, comprovante bancário, QR code, chip SIM, câmera de segurança, chave, documento.
  - **Estética cinematográfica documental brasileira:** iluminação natural e sóbria realista, fotografia 35mm com grão analógico suave, paleta base carvão (`#0D0D0F`) e osso (`#E8E2D7`). O coral (`#FF5A47`) é reservado estritamente para o ponto explorado ou revelado (5% a 12% do frame).
  - **Momento da Brecha canônico:** O congelamento (freeze-frame) ocorre no instante da decisão crítica humana da vítima (o dedo hesitando sobre a tela/teclado). A fissura coral assimétrica contorna cirurgicamente o botão/campo. É PROIBIDO qualquer pulso concêntrico de luz, efeito neon, aura brilhante ou sabre de luz.
  - **Evidência Real obrigatória:** Cenas de evidência devem retratar documentos autênticos (relatórios do Banco Central MED, Febraban, boletins da SSP, extratos bancários com blur de privacidade), nunca imagens de IA fingindo ser prova.
  - **Retorno ao Objeto no Fechamento:** O fechamento (Ato 4) encerra com retorno visual obrigatório ao mesmo objeto do cold open (o mesmo smartphone sobre a mesma mesa de madeira da Cena 1, com o golpe desarmado). Três passos de defesa práticos em menos de 10 minutos (zero chaves físicas YubiKey ou hardware gringo).
  - **Continuidade causal:** o objeto de uma cena causa a próxima (ex: o celular na mão vira a tela do app; a tela vira o alerta do banco).
  - **Proibição absoluta de clichês:** zero hackers de capuz, zero chuva de código verde estilo Matrix, zero neon azul/vermelho, zero cenários futuristas caricatos, zero pulsos concêntricos.
- **Canal HSL** (engenharia e infraestrutura física oculta): siga o estilo das skills `hsl-scene-direction` e `cinematography`: corte técnico, escala monumental, máquinas e sistemas físicos com iluminação de precisão.

Não inclua texto, letras, legendas, logotipos ou marcas na imagem.

Aspecto obrigatório: 16:9. O `durationSeconds` e o `beatId` devem ser copiados sem alteração. Use `firstFrameFrom: "image"`.
Sempre preencha `negative` com as exclusões visuais, inclusive texto e marcas, e `continuityRefs` com uma lista de IDs relacionados ou uma lista vazia.

O imagePrompt deve mostrar o objeto físico e a ação que explicam a narração daquele beat, com equipamento, material, ambiente e escala compatíveis com o episódio. Nunca devolva apenas "industrial scene" ou uma imagem intercambiável entre temas.

Trate cada beat como um plano filmável. O `imagePrompt` descreve somente o primeiro frame, antes da ação. O `videoPrompt` parte exatamente desse estado e descreve uma única ação física observável durante a duração disponível. Não declare corrente, torque, fase, frequência, energia, sincronismo, aquecimento interno ou causalidade como se fossem visíveis; mostre um instrumento físico, indicador, atuador ou mudança de estado que possa ser filmada, deixando medidas e explicações para a composição.

O valor de `cameraMotion` deve concordar literalmente com o movimento descrito em `videoPrompt`: `LOCKED_TELEMETRY` é câmera fixa; `SLOW_PAN_LEFT/RIGHT` é pan horizontal; `SLOW_DOLLY_IN` avança; `ZOOM_OUT_REVEAL` usa zoom óptico; `CAMERA_DRIFT` é deslocamento curto; `PULSING_ORBIT` é um arco orbital controlado; `ISOMETRIC_GLIDE` é travelling diagonal; `FAST_WHIP_PAN` é um único chicote breve seguido de parada. Nunca misture dois movimentos ou use pan para descrever tilt, órbita, slide ou zoom.

Preserve continuidade nos `continuityRefs`: mesma máquina, geometria, cor, iluminação, posição de indicadores, direção de movimento e horário. Se houver mudança deliberada de local ou tempo, torne o corte explícito. Não repita uma ação que já esteja concluída no primeiro frame. Para ações rápidas, descreva estado inicial, evento único e estado final sustentado; nunca peça repetição em loop.

Verifique a progressão do episódio inteiro antes de responder. Distribua visualmente a tese, o mecanismo, a falha, a consequência e a resolução/restauração. Cada problema da revisão anterior é obrigatório: corrija o beat indicado e também as referências de continuidade afetadas. Não apenas parafraseie o prompt reprovado.

Os campos graphicHeadline, telemetryLabel e qualquer instrução legada de typography, title card, HUD ou infográfico são metadados para overlays da composição. Não os copie para imagePrompt. Quando a descrição legada for um cartão de título, proponha uma fotografia de um objeto ou mecanismo concreto que represente a tese da narração. O plano original não deve ser reescrito.

Briefing do episódio:
{{episodeBrief}}

Plano:
{{scenePlan}}

Problemas apontados pela revisão anterior:
{{reviewIssues}}
