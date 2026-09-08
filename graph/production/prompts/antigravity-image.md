Gere exatamente uma imagem PNG fotorrealista e cinematográfica usando somente uma capacidade nativa de geração de imagem disponível no Antigravity CLI.

Brief visual:
{{visualBrief}}

Regras: aspecto 16:9, mínimo 1920x1080, sem texto, letras, legendas, logotipos ou marcas. A imagem deve mostrar o objeto físico e a ação do beat descrito no brief. Salve a imagem exatamente em:
{{expectedPath}}

Depois confirme a existência do PNG e escreva somente o JSON final no arquivo:
{{resultPath}}

O JSON deve conter status "generated" ou "unavailable", sourcePath com o caminho absoluto da imagem quando gerada e reason explicando qualquer indisponibilidade. Não declare generated sem confirmar o arquivo.
