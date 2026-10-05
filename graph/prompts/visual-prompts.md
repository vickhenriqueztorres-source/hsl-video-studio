# Direção Visual de Produção (HSL & BRECHA)

Crie prompts cinematográficos fotorrealistas para cada beat do plano JSON abaixo respeitando as diretrizes do canal e a estrutura obrigatória em 6 blocos para `imagePrompt`.

---

## 1. Diretrizes por Canal

### Canal BRECHA (Documentário de Defesa Cotidiana e Investigação Forense Brasileira)
- **Ambientes reais cotidianos brasileiros:** Cozinha residencial com azulejos e bancada de fórmica, portaria de condomínio com interfone, balcão de comércio de bairro com notas fiscais, interior de carro popular no trânsito urbano sob dia nublado, ônibus municipal, calçada comercial. A vulnerabilidade ocorre na vida real do cidadão comum, NUNCA em "laboratórios de hackers", "bancadas investigativas cenográficas cheias de roteadores" ou cenários futuristas.
- **Objetos tangíveis reconhecíveis:** Smartphone comum com capinha de proteção, maquininha de cartão POS, cartão bancário com chip, recibo de papel térmico, boletos de contas mensais (luz, água, telefone), chip SIM, documentos de identificação com tarjas de anonimização.
- **Estética documental crua e neutra:** Iluminação funcional e neutra (luz fluorescente branca de teto, lâmpada LED comum de cozinha, luz diurna fria difusa através de janela). PROIBIDO golden hour artificial, "luz suave de pôr do sol", "bancada de madeira maciça de luxo" ou "vapor estilizado subindo de xícara de café". Paleta majoritariamente neutra baseada em carvão (`#0D0D0F`), osso (`#E8E2D7`), cinzas minerais e fórmica. O coral (`#FF5A47`) é reservado estritamente para o instante da fenda e o elemento explorado (5% a 12% do frame).
- **Política de Personagem (characterPolicy):** Presença humana estritamente `periférica` ou `ausente`. O objeto ou documento é o protagonista absoluto. Mãos em plano detalhe estritamente funcional (atender, digitar senha, segurar papel, hesitar sobre a tecla), sem poses artificiais de banco de imagens. PROIBIDO qualquer close frontal dramático em rostos ou expressões teatrais forçadas de pânico ("expressão apelativa de thumbnail").
- **Momento da Brecha canônico:** O congelamento (freeze-frame) ocorre no instante da decisão crítica humana da vítima (o dedo hesitando milímetros sobre o botão "Confirmar" ou no teclado numérico). A fissura coral assimétrica contorna cirurgicamente o campo explorado. É PROIBIDO qualquer pulso concêntrico de luz, aura brilhante, efeito neon ou sabre de luz.
- **Evidência Real obrigatória:** Cenas de evidência documental devem retratar relatórios e dados autênticos (Banco Central MED, Febraban, boletins da SSP, extratos bancários com blur de privacidade), nunca ilustrações conceituais abstratas ou hackers encapuzados.
- **Retorno ao Objeto no Fechamento:** O fechamento (Ato 4) encerra com retorno visual obrigatório ao mesmo objeto do cold open (o mesmo smartphone sobre a mesma bancada de fórmica da Cena 1, com a chamada encerrada/bloqueada e o app oficial seguro). Três passos de defesa práticos em menos de 10 minutos (zero hardware gringo ou chaves físicas tipo YubiKey).
- **Continuidade causal:** O objeto de uma cena causa a próxima (ex: o celular repousado toca -> o dedo atende em viva-voz -> a tela exibe o identificador falso -> o extrato mostra o débito).
- **Proibição absoluta de clichês:** Zero hackers de capuz, zero código verde escorrendo estilo Matrix, zero neon azul/vermelho cyberpunk, zero bancadas com monitores múltiplos e fones de ouvido em quarto escuro.

### Canal HSL (Engenharia e Infraestrutura Física Oculta)
- **Escala monumental e sistemas físicos reais:** Tubulações industriais, manômetros analógicos, atuadores pneumáticos, transformadores elétricos, barramentos de cobre, servidores de alta densidade em rack.
- **Iluminação técnica de precisão:** Feixes de luz direcional, contrastes industriais controlados, microtexturas de aço escovado, cobre oxidado, tinta eletrostática cinza e cabos cabeados com precisão cirúrgica.

---

## 2. Estrutura Obrigatória em 6 Blocos para Todo `imagePrompt`

Todo `imagePrompt` gerado DEVE ser formulado como uma única tomada fotográfica documental detalhada, cobrindo explicitamente os seguintes 6 blocos:

1. **[Lente & Enquadramento]:** Especificar distância focal e lente (ex: macro 50mm f/1.8, 35mm f/2.4, prime 85mm), ângulo de câmera (plano detalhe fechado, vista superior ortogonal em 45°, plano médio na altura dos olhos), profundidade de campo rasa com separação nítida de planos e textura sutil de filme analógico 35mm (grão fino orgânico). Proporção 16:9 obrigatória.
2. **[Sujeito & Ação Física]:** Descrever o objeto ou mecanismo físico protagonista em seu estado exato ANTERIOR à ação, posicionado em ambiente real e tangível.
3. **[Telas, Textos & Interfaces Diegéticas - Isolamento Rigoroso por Canal]:**
   SEMPRE que a cena contiver telas, monitores, visores de telemetria, manômetros, recibos, painéis ou documentos, DESCREVA A INTERFACE COM TEXTOS EXATOS ENTRE ASPAS, RESPEITANDO O IDIOMA MANDATÓRIO DO CANAL:
   - **Para o Canal HSL (Hidden Systems Lab):** TODOS os textos no interior da imagem (telas industriais, monitores de controle SCADA, displays de telemetria, manômetros, painéis elétricos, etiquetas de rack, rotulagem de equipamentos, manifests logísticos, códigos e relatórios técnicos) **DEVEM ESTAR ESTRITAMENTE EM INGLÊS TÉCNICO**. É expressamente PROIBIDO usar palavras em português nos textos entre aspas em cenas de HSL.
     - *Exemplo Telemetria Industrial:* Display digital OLED de alto contraste exibindo dados de fluxo: "SYSTEM PRESSURE // 180 BAR - FLOW: 450 L/MIN - STATUS: NOMINAL".
     - *Exemplo Manômetro / Medidor:* Mostrador circular analógico com mostrador branco nítido e escala técnica: "PRESSURE PSI - RANGE 0 TO 3500 - OPERATING 2600 PSI".
     - *Exemplo Cadeia Fria / Sensores:* Visor LCD monocromático de data logger industrial: "COLD CHAIN LOG // TEMP: +2.8°C - THRESHOLD: 2.0°C TO 8.0°C - SENSOR: TC-9014".
     - *Exemplo Servidores / Redes:* Etiqueta de rack de alumínio e terminal de fibra óptica: "OPTICAL AMPLIFIER STAGE 03 // FIBER TRUNK NY-LON - LATENCY 28.4 MS".
   - **Para o Canal BRECHA:** TODOS os textos em interfaces cotidianas (smartphones, apps de bancos digitais, transferências Pix, visores de maquininhas POS, caixas eletrônicos, recibos térmicos, boletos e documentos) **DEVEM ESTAR ESTRITAMENTE EM PORTUGUÊS BRASILEIRO**. É expressamente PROIBIDO usar termos em inglês em interfaces domésticas brasileiras.
     - *Exemplo Celular:* A tela OLED nítida exibe a interface do banco digital com notificação push: "Transferência Pix de R$ 4.850,00 enviada para Lucas Silva".
     - *Exemplo Maquininha:* Visor LCD monocromático iluminado com caracteres em matriz de pontos: "INSIRA OU APROXIME O CARTÃO - R$ 18,50".
     - *Exemplo Recibo:* Papel térmico branco fosco com serrilhado de corte e impressão nítida: "COMPROVANTE DE PAGAMENTO - TRANS: 849204 - VALOR: R$ 1.250,00".
   *(Nota Comum: Proibido em ambos os canais cartões flutuantes de título e legendas editoriais soltas, pois estes pertencem aos overlays de pós-produção).*
4. **[Iluminação Física & Diegética]:** Descrever a interação real da luz física: a luz emitida pelo vidro da tela iluminando os dedos e a bancada adjacente, reflexos especulares difusos sobre plástico fosco e metal, oclusão de contato na base do objeto e iluminação ambiental realista (tubos fluorescentes neutros, luz difusa de dia cinzento).
5. **[Materiais & Microtexturas]:** Textura palpável de superfícies reais: fórmica texturizada cinza ou bege, plástico ABS ligeiramente rugoso, vidro temperado com reflexos microscópicos sutis, papel térmico fosco, marcas naturais de uso real.
6. **[Paleta & Atmosfera Documental]:** Tons predominantemente neutros e sóbrios baseados em carvão (`#0D0D0F`), osso (`#E8E2D7`), cinzas minerais e aço. O coral (`#FF5A47`) surge pontualmente apenas quando marcar a fenda ou vetor crítico de anomalia. Zero saturação exagerada, zero filtros artificiais.

---

## 3. Regras de Produção e Esquema

- **Aspecto e Formato:** Proporção 16:9 obrigatória. Copie `beatId` e `durationSeconds` do plano sem alteração. Use sempre `firstFrameFrom: "image"`.
- **Preenchimento de `negative`:** Sempre inclua exclusões visuais pertinentes: `marcas d'água, logotipos comerciais protegidos de terceiros, texto borrado ilegível, letras incompreensíveis, cartões de título gráficos flutuantes, legendas editoriais, HUD sci-fi, renderização 3D plástica, CGI barato, hacker de capuz, estética neon cyberpunk, aberração cromática pesada, mãos deformadas com dedos extras`.
- **Continuidade nos `continuityRefs`:** Mantenha coerência visual absoluta entre beats interligados (mesmo modelo de celular, mesma bancada, mesma cor de capinha, mesma iluminação e ângulo compatível).
- **Contrato Filmável:**
  - O `imagePrompt` descreve o primeiro frame ESTÁTICO antes de qualquer movimento começar.
  - O `videoPrompt` parte EXATAMENTE desse primeiro frame e descreve uma única ação física observável durante a duração daquele beat.
  - O `cameraMotion` deve concordar literalmente com a ação descrita: `LOCKED_TELEMETRY` (câmera travada), `SLOW_DOLLY_IN` (avanço lento), `SLOW_PAN_RIGHT`/`LEFT` (panorâmica horizontal), `CAMERA_DRIFT` (deslocamento sutil), `ZOOM_OUT_REVEAL` (revelação em zoom óptico), `ISOMETRIC_GLIDE` (travelling diagonal) ou `FAST_WHIP_PAN` (chicote breve). Nunca misture dois movimentos incompatíveis.

---

## 4. Exemplos Padrão-Ouro (Few-Shot Examples)

### Exemplo 1: Smartphone em Balcão com Notificação de Fraude (Canal BRECHA)
```json
{
  "beatId": "SCENE_002",
  "durationSeconds": 4.5,
  "firstFrameFrom": "image",
  "imagePrompt": "Fotografia documental cinematográfica em plano detalhe macro 50mm f/1.8 com profundidade de campo rasa em proporção 16:9. Um smartphone comum com capinha de silicone preta repousa sobre uma bancada de fórmica cinza com bordas gastas ao lado de um boleto de energia elétrica dobrado. A tela OLED nítida e acesa exibe a barra superior do sistema operacional e um banner de notificação push em português com texto nítido: \"ALERTA DE SEGURANÇA: Nova transação Pix de R$ 3.840,00 em análise\". A luz branca emitida pelo display ilumina suavemente os grãos da fórmica e projeta sombras de oclusão suaves sob o aparelho. Texturas táteis de vidro com microporosidades e papel impresso. Cores sóbrias em carvão (#0D0D0F), cinza mineral e osso (#E8E2D7), com o ícone de alerta em tom coral discreto (#FF5A47). Grão analógico sutil de filme 35mm, iluminação ambiente neutra de lâmpada fluorescente comum de teto.",
  "videoPrompt": "Câmera absolutamente estável fixada no smartphone. Na tela do aparelho, o banner de notificação pulsa levemente com um segundo aviso de sistema enquanto uma sombra sutil de uma mão se aproxima da borda do quadro sem tocar no aparelho, mantendo a tensão estática da cena.",
  "cameraMotion": "LOCKED_TELEMETRY",
  "continuityRefs": ["SCENE_001"],
  "negative": "marcas d'água, legendas editoriais soltas, cartões gráficos flutuantes, texto borrado ilegível, letras incompreensíveis, hacker de capuz, neon, 3D render plástica, iluminação dramática de cinema falso"
}
```

### Exemplo 2: Maquininha de Cartão e Recibo Térmico (Canal BRECHA)
```json
{
  "beatId": "SCENE_007",
  "durationSeconds": 5.0,
  "firstFrameFrom": "image",
  "imagePrompt": "Close macro em 35mm f/2.0 com profundidade de campo seletiva em ângulo de 45 graus, proporção 16:9. Uma maquininha portátil de pagamento com cartão de corpo plástico preto fosco está apoiada sobre um balcão comercial de madeira laminada simples de loja brasileira. O visor LCD monocromático verde iluminado exibe com nitidez absoluta os caracteres em matriz de pontos: \"APROXIME OU INSIRA O CARTÃO - R$ 120,00\". Saindo da ranhura superior do terminal, uma tira curta de papel térmico branco fosco com serrilhado de corte exibe linhas de comprovante impresso em tinta preta nítida: \"COMPROVANTE LOJA - VIA CLIENTE\". Luz fluorescente fria de teto de comércio refletindo suavemente no plástico e na bobina de papel. Paleta documental neutra em cinza escuro, osso e verde-azulado sóbrio. Textura rugosa de plástico industrial, micro-ranhuras e grão fino documental.",
  "videoPrompt": "Câmera inicia focada no visor da maquininha e realiza um avanço lento e contínuo em linha reta em direção ao visor LCD, mantendo os caracteres nítidos e a iluminação fluorescente uniforme durante todo o trajeto.",
  "cameraMotion": "SLOW_DOLLY_IN",
  "continuityRefs": ["SCENE_006"],
  "negative": "marcas d'água, legendas flutuantes, títulos soltos, tela ilegível, texto deformado, efeito neon, brilho artificial exagerado, render 3D"
}
```

### Exemplo 3: Momento da Brecha / Freeze-Frame de Decisão (Canal BRECHA)
```json
{
  "beatId": "SCENE_014",
  "durationSeconds": 4.0,
  "firstFrameFrom": "image",
  "imagePrompt": "Plano detalhe macro estrito em lente prime 85mm f/2.4 com profundidade de campo extremamente reduzida, 16:9. A tela de um smartphone sobre a bancada mostra o diálogo de confirmação de transferência com botões virtuais nítidos: \"CANCELAR\" e \"CONFIRMAR TRANSFERÊNCIA\". O dedo indicador de uma mão comum brasileira paira a menos de dois milímetros do botão de confirmação, congelado no instante da decisão. Uma linha fina, irregular e assimétrica em cor coral vibrante (#FF5A47) contorna milimetricamente a borda do botão de confirmação como uma fenda cirúrgica. Iluminação funcional neutra, a luz da tela rebate na ponta do dedo criando um brilho diegético natural. Sem auras brilhantes, sem raios neon, sem sabres de luz. Textura nítida de pele humana real com impressões digitais sutis e vidro reflexivo limpo.",
  "videoPrompt": "Quadro estático em freeze-frame documental absoluto. Apenas a iluminação da interface mantém sua luminescência sutil enquanto a câmera mantém telemetria rigorosamente travada no ponto de hesitação entre o dedo e o botão.",
  "cameraMotion": "LOCKED_TELEMETRY",
  "continuityRefs": ["SCENE_013"],
  "negative": "pulso concêntrico de luz, aura brilhante, efeito neon cyberpunk, sabre de luz, dedos deformados, mão extra, renderização plástica 3D, texto borrado"
}
```

### Exemplo 4: Painel Industrial de Telemetria e Válvulas Físicas (Canal HSL)
```json
{
  "beatId": "SCENE_018",
  "durationSeconds": 6.0,
  "firstFrameFrom": "image",
  "imagePrompt": "Fotografia técnica industrial cinematográfica em 35mm f/2.8 com iluminação direcional rasante, proporção 16:9. Vista em ângulo lateral de um conjunto de tubulações de aço escovado com soldas aparentes conectadas a um manômetro analógico com mostrador branco nítido, ponteiro preto e escala graduada técnica em inglês: \"SYSTEM PRESSURE // 180 BAR - NOMINAL RANGE 0-250 BAR - STATUS: OPTIMAL\". Conexões hidráulicas de alta pressão com parafusos sextavados e pequenas marcas de oxidação e óleo mineral sobre flanges metálicos. A luz de serviço incide a 45 graus criando reflexos especulares controlados nas arestas do aço e sombras bem definidas. Paleta rigorosa em carvão (#0D0D0F), cinza metálico e osso (#E8E2D7). Textura tátil de metal usinado e tinta eletrostática cinza fosca.",
  "videoPrompt": "A câmera realiza um deslocamento lateral suave e constante da esquerda para a direita ao longo do eixo da tubulação principal, revelando a extensão das conexões metálicas enquanto o ponteiro do manômetro permanece travado na faixa de operação.",
  "cameraMotion": "SLOW_PAN_RIGHT",
  "continuityRefs": ["SCENE_017"],
  "negative": "texto em português, fumaça estilizada, faíscas cinematográficas falsas, atmosfera sci-fi, luzes neon coloridas, gráficos flutuantes, render 3D estilizado"
}
```

### Exemplo 5: Monitor de Cadeia Fria e Telemetria de Transporte (Canal HSL)
```json
{
  "beatId": "SCENE_024",
  "durationSeconds": 5.0,
  "firstFrameFrom": "image",
  "imagePrompt": "Fotografia documental macro em 50mm f/2.0 com profundidade de campo rasa, proporção 16:9. Um data logger digital de temperatura de padrão farmacêutico acoplado a um contêiner isotérmico de transporte refrigerado com travas de aço inoxidável. O display LCD monocromático iluminado por LED âmbar exibe telemetria nítida com caracteres estritamente em inglês: \"COLD CHAIN TELEMETRY // TEMP: +2.8°C - LIMITS: 2.0°C - 8.0°C // BATCH ID: VAX-90412 - STATUS: VERIFIED\". Gotículas de condensação sutil sobre a carcaça de policarbonato cinza fosco. Iluminação ambiente neutra e funcional de hangar logístico refrigerado. Paleta sóbria em cinzas industriais, carvão (#0D0D0F) e osso (#E8E2D7).",
  "videoPrompt": "Câmera absolutamente estável fixada no display do registrador de temperatura enquanto um operador em traje térmico aproxima um leitor óptico portátil na lateral do contêiner sem obstruir a visão da tela.",
  "cameraMotion": "LOCKED_TELEMETRY",
  "continuityRefs": ["SCENE_023"],
  "negative": "texto em português, legendas soltas, títulos flutuantes, efeitos sci-fi futuristas, hologramas, render 3D plástico, texto ilegível"
}
```

---

## 5. Entrada da Tarefa

Canal de Produção e Idioma Obrigatório:
{{channelContext}}

Briefing do episódio:
{{episodeBrief}}

Plano:
{{scenePlan}}

Problemas apontados pela revisão anterior:
{{reviewIssues}}

