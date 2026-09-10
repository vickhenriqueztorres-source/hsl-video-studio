# BRECHA — Diretrizes Visuais, Gramática de Cenas e Montagem

Versão 2.0 — Alinhamento Estrito com a Brand Bible Oficial (`editorial.md`)  
Finalidade: Definir o sistema visual e o motor de seleção de cenas para o canal BRECHA.

---

## 1. Identidade e Filosofia Visual

O formato visual do BRECHA é um **documentário de defesa cotidiana**.

O canal transforma golpes, fraudes digitais e manipulações invisíveis em histórias visuais compreensíveis e rigorosamente fundamentadas. Não é uma colagem de hackers de capuz, matrizes de código verde ou efeitos de computação gráfica genéricos. Cada episódio investiga o ponto de contato entre a vida cotidiana brasileira e os sistemas digitais invisíveis.

### Princípio Editorial Mestre

> **IA representa. Evidência confirma. A fenda revela.**

- **Nenhum fato central pode depender exclusivamente de uma imagem gerada por IA.**
- A ameaça entra na vida real: cozinha, quarto, portaria, trânsito, calçada, escritório ou transporte público.
- Objetos físicos e reconhecíveis ancoram a narrativa: o smartphone, o cartão de banco, o comprovante Pix, a URA telefônica, o chip SIM e as mensagens oficiais.

---

## 2. A Gramática dos Seis Modos Canônicos (Seção 17)

O diretor de cenas e o pipeline de produção operam com seis modos visuais específicos. Cada modo cumpre uma função narrativa insubstituível:

### Modo 1 — SUPERFÍCIE
**O que a vítima percebe.**
- **Estética:** Câmera próxima, luz neutra e crua funcional (lâmpada de teto comum, fluorescente de cozinha/portaria, dia nublado, sem golden hour ou pôr do sol) e ambiente cotidiano brasileiro autêntico (cozinha com azulejos, portaria, ponto de ônibus, mesa simples de trabalho). Fotografia documental sóbria em 35mm com grão analógico suave. Paleta majoritariamente neutra baseada em cinzas minerais, carvão (`#0D0D0F`) e osso (`#E8E2D7`).
- **Elementos:** Telefone celular sobre bancada de fórmica ou granito cinza, boletos e contas mensais de rotina, tela de chamada recebida, comprovante de pagamento.
- **Política de Personagem:** `characterPolicy: 'ausente' | 'periferica'`. O objeto físico é o protagonista absoluto; figuração humana restrita a mãos funcionais em plano detalhe, sem poses de stock.
- **Função:** Familiaridade e identificação imediata com a rotina do cidadão comum.
- **Duração usual:** 3 a 7 segundos por tomada.
- **Som:** Som ambiente natural (diegese) entra antes da narração.

### Modo 2 — ABERTURA
**O instante em que a confiança, a pressa ou o senso de urgência é explorado.**
- **Estética:** O movimento de câmera desacelera. O som ambiente recua levemente.
- **Sinalização:** A cor Coral (`#FF5A47`) aparece sutilmente pela primeira vez, pontuando a anomalia (o número no identificador, o valor na notificação, a palavra estranha na voz profissional).
- **A Fenda:** A fissura não explica tudo de imediato; funciona como uma linha sutil indicando que existe outra camada oculta sob a superfície.
- **Duração usual:** 2 a 5 segundos.

### Modo 3 — INTERIOR
**O mecanismo invisível por trás da tela.**
- **Estética:** Motion graphics funcional em Remotion e composições 2.5D. Câmera ortogonal e objetiva. Paleta com carvão (`#0D0D0F`), osso (`#E8E2D7`), verde-azulado sóbrio (`#4F9B96`) para fluxos legítimos e coral (`#FF5A47`) para rotas exploradas.
- **Elementos:** Diagramas funcionais de protocolos de telecomunicação (VoIP/SIP), roteamento de servidores de chamada, fluxo de contas intermediárias (laranjas) e pulverização de valores via Pix.
- **Regra:** Cada linha e nó possui origem, destino e causalidade factual comprovada. Proibidas redes neurais "decorativas" ou grafos complexos que não expliquem um evento real.
- **Duração de sequência:** 20 a 60 segundos.

### Modo 4 — EVIDÊNCIA
**A prova material real e irrefutável.**
- **Estética:** Documentos oficiais, relatórios regulatórios, dados do Banco Central do Brasil (MED), boletins estatísticos de estelionato da SSP, pesquisas da Febraban, telas reais de bancos e extratos bancários com rigoroso blur/anonimização de dados privados.
- **Ordem de Exibição:** Primeiro o documento por inteiro (contexto e autenticidade com cabeçalho oficial visível) → aproximação controlada da câmera → destaque/grifo na linha de dado relevante → interpretação narrativa.
- **Proibição Absoluta:** Nunca utilizar IA generativa para falsificar ou simular um documento ou prova real. O selo e a fonte oficial (`SRC_BCB_MED_2024`, `SRC_SSP_ESTELIONATO_2025`) devem ser explicitamente identificados em tela.
- **Duração usual:** 8 a 14 segundos por peça documental.

### Modo 5 — MOMENTO DA BRECHA
**O formato proprietário do canal.**
- **Conceito:** O clímax analítico do episódio. Não se confunde com os diagramas de rede do Modo Interior. O Momento da Brecha é o ponto cego da vítima — o congelamento exato no instante em que a decisão humana crítica é tomada.
- **Comportamento:**
  - A ação congela completamente em **FREEZE-FRAME** (a mão hesitando sobre a tela, o dedo prestes a digitar a senha ou autorizar a operação).
  - O áudio cai subitamente para quase-silêncio (apenas um zumbido grave contido de 0,8 segundo).
  - A **fissura coral assimétrica** (`#FF5A47`) rasga o quadro e contorna cirurgicamente o botão ou elemento explorado pela engenharia social.
  - Narração obrigatória: *"A brecha estava aqui."*
  - **PROIBIÇÕES DA FENDA:** A fissura nunca é simétrica, nunca é neon e nunca é mágica. É estritamente proibido qualquer pulso concêntrico de luz, aura cintilante, efeito sabre de luz ou explosão de partículas.

### Modo 6 — FECHAMENTO
**O mecanismo se fecha e se transforma em agência e sobrevivência.**
- **Conceito:** Devolver o controle ao espectador sem recorrer a paranoias, conselhos vagos ou soluções inacessíveis.
- **Retorno Obrigatório ao Objeto do Cold Open:** A cena deve retornar visualmente ao mesmo objeto e ambiente da abertura (o mesmo smartphone sobre a mesma mesa de madeira da Cena 1). Desta vez, o golpe está desarmado: a chamada suspeita é rejeitada/bloqueada, e o aplicativo bancário oficial é aberto com segurança.
- **Protocolo dos 3 Passos Priorizados:**
  1. **Desligar imediatamente:** Desconfiar de qualquer ligação recebida. O banco nunca liga solicitando cancelamento de transação por digitação de senhas ou envio de códigos.
  2. **Canal oficial:** Retornar o contato exclusivamente pelo número de telefone impresso no verso do cartão físico ou abrir o app oficial digitando o endereço.
  3. **Configuração de limites:** Ajustar os limites diurnos e noturnos de Pix e cadastrar contatos de segurança diretamente no aplicativo da instituição.
- **Proibição:** É estritamente vedado indicar soluções que exijam hardware caro ou inacessível ao brasileiro comum (como chave física YubiKey). A defesa deve ser viável em menos de 10 minutos por qualquer cidadão.
- **Assinatura Final:** O vídeo encerra com a marca do canal e a assinatura mestre: *"Toda fraude começa por uma brecha."*

---

## 3. Distribuição Visual Canônica por Episódio (Seção 20)

Para manter o equilíbrio documental e evitar a monocultura de imagens geradas, todo episódio do BRECHA deve seguir a proporção estipulada na Seção 20 da Brand Bible:

| Categoria | Faixa Recomendada | Modos de Cena | Função Editorial |
|---|---:|---|---|
| **Remotion, interfaces e diagramas** | **30–35%** | Modo INTERIOR | Explicar causalidade técnica e fluxos invisíveis |
| **Evidência e material real** | **25–30%** | Modo EVIDÊNCIA | Assegurar credibilidade com fontes oficiais e documentos |
| **Reconstrução por IA** | **25–30%** | Modos SUPERFÍCIE e ABERTURA | Representar ação humana sem registro com selo visual |
| **Tipografia, transições e respiro** | **10–15%** | Modo FECHAMENTO e Viradas | Hierarquia, dados monetários, datas e protocolo defensivo |

### Regras de Distribuição e Integridade
1. **Limite de Consecutividade:** É proibido usar mais de duas cenas realistas de IA consecutivas sem intercalar com documento de evidência real, interface ou diagrama causal.
2. **Rotulagem Obrigatória:** Toda cena de reconstituição fotorrealista gerada por IA deve conter o disclaimer visual discreto `RECONSTITUIÇÃO` (componente `ReconstructionLabel`).
3. **Nenhum Fato Central Dependente de IA:** Alegações centrais de perdas financeiras, volumes roubados ou funcionamento de golpes devem ser confirmadas visualmente com tela de documento ou extrato oficial.

---

## 4. Curva de Ritmo e Métricas de Edição

- **Benchmark de Ritmo (fern):** O canal adota como métrica de corte e engajamento 19 a 35 mudanças visuais significativas no primeiro minuto (cold open). Isso não significa cortes frenéticos de videoclipe, mas dinamismo com transformações de quadro, revelações de fenda, aproximações e destaques de texto dentro do mesmo plano.
- **Cadência de Narração:** 150 a 165 palavras por minuto. Reduzir o ritmo e incluir pausas deliberadas durante a leitura de evidências e no Momento da Brecha.
- **Pausa do Momento da Brecha:** 0,8 a 1,5 segundo de respiro e quase-silêncio no congelamento antes e depois da frase-chave.

---

## 5. Biblioteca de Componentes Remotion para BRECHA

| Componente | Função |
|---|---|
| `ReconstructionLabel` | Selo de aviso de dramatização/reconstituição com ponto coral suave. |
| `EvidenceCaption` | Lower-third indicando a fonte primária oficial documentada. |
| `EvidenceFrame` | Apresentação em tela de documentos oficiais (BCB MED, SSP, Febraban) com destaque. |
| `MomentOfBreach` | Freeze-frame com isolamento temporal e fenda coral contornando a decisão crítica. |
| `HslUniversalHeader` | Header superior adaptativo com badge Coral `BRECHA` e atos brasileiros (`ATO 01 // ...`). |
| `ChannelShell` | Container que orquestra as camadas de conformidade e metadados visuais. |

---

## 6. Política de Personagem e Enquadramento Humano (`characterPolicy`)

O canal BRECHA adota uma diretriz estrita para a presença humana: **o objeto, o documento oficial ou a interface do sistema é o protagonista absoluto**.

### Princípios de Figuração Documental
- **Modos de Presença Permitidos:** Estritamente `periferica` ou `ausente`.
- **Ausente (`absent`):** O objeto vive sozinho no espaço documental (exemplo: smartphone tocando sobre a bancada de fórmica, documento oficial aberto, tela do caixa eletrônico, painel do carro com GPS).
- **Periférica (`peripheral`):** A presença humana é sempre parcial, funcional e mecânica:
  - Enquadramento em plano detalhe (macro ou close) de mãos operando o dispositivo (atendendo chamada, hesitando sobre a tecla virtual, segurando comprovante). Mãos comuns, sem unhas perfeitas de modelo de publicidade.
  - Antebraço apoiado ou silhueta de perfil/costas em segundo plano desfocado (*shallow depth of field*).
- **Proibição Absoluta de Closes Dramáticos em Rostos:** É terminantemente proibido gerar closes frontais em rostos com expressões forçadas de pânico, susto ou desespero ("expressões de thumbnail de terror"). Se uma pessoa for mostrada em plano aberto de contextualização, o enquadramento deve ser lateral, neutro e sem caricatura emocional.

### Comparativo: Documentário Real vs Clichês de Midjourney / Banco de Imagem

| Dimensão Visual | Proibido (Clichê de Banco de Imagem / Midjourney) | Obrigatório (Documentário Canônico BRECHA) |
|---|---|---|
| **Iluminação** | Luz dourada de fim de tarde (*golden hour*), sombras poéticas de pôr do sol, claridade acolhedora de Pinterest | Luz crua, neutra e funcional: lâmpada fluorescente branca de cozinha/portaria, luz difusa de dia nublado por janela simples, lâmpada de teto comum |
| **Mobiliário** | Mesa de madeira maciça envernizada, bancada de carvalho escuro, escritório sofisticado | Mesa de fórmica clara, bancada de granito cinza salpicado, azulejo branco de cozinha, balcão de portaria de condomínio, assento de ônibus urbano |
| **Cenografia** | Xícara de café com vapor subindo, plantas decorativas, velas, livros de design | Boletos de água/luz, correspondências bancárias, bloco de anotações com caneta esferográfica, chave comum, cartão de banco gasto |
| **Ambiente de Rede** | "Bancada técnica investigativa com laptop, fones e roteador" (*laboratório hacker disfarçado*) | **Zero bancadas hackers.** Cenas de rede são diagramas causais 2.5D ortogonais em Remotion; Cenas de prova são documentos oficiais auditados |
| **Figura Humana** | Modelos em poses dramáticas de sofrimento ou mãos posando artificialmente | Mãos em gestual funcional e mecânico cotidiano; presença periférica ou ausente |
| **Câmera** | Movimentos excessivos de grua/drone, giros rápidos, zooms dramáticos | Enquadramentos sóbrios e estáveis, câmera fixa (`LOCKED_TELEMETRY`), deslocamento suave (`CAMERA_DRIFT`) e planos detalhe funcionais |

