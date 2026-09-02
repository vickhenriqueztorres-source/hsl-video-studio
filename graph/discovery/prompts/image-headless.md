# Descoberta de geração de imagem headless

Provider em teste: `{{provider}}`.

Gere exatamente UMA imagem PNG fotorrealista e cinematográfica, sem texto,
mostrando uma estação elétrica industrial ao anoitecer, em aspecto 16:9 e
dimensões mínimas de 1280x720. Salve exatamente em:

`{{expectedPath}}`

Use somente uma capacidade nativa de geração de imagem disponível nesta IDE.
Não crie SVG, não converta um SVG programático, não baixe imagem e não fabrique
um PNG por código. Se a geração de imagem ou a escrita no path não estiver
disponível em modo headless, declare `status` como `unavailable` e explique em
`notes`. Só declare `generated` depois de confirmar que o PNG existe.

No resultado JSON, repita exatamente o provider e o expectedPath recebidos.
