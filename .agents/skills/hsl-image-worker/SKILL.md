---
name: hsl-image-worker
description: >-
  Consome filas QUEUE.json de Start Frames do Hidden Systems Lab usando a geração
  de imagem nativa da IDE. Use quando o usuário pedir para gerar imagens do episódio,
  consumir uma fila de imagens ou executar hsl-image-worker.
---

# HSL Image Worker

Trabalhe somente na fila indicada pelo usuário. Se nenhuma for indicada, localize o arquivo QUEUE.json mais recente em runs/*/images por data de modificação.

1. Leia QUEUE.json. Processe, na ordem, cada item com status pending; itens done permanecem intactos.
2. Leia o promptPath do item sem alterá-lo. Gere uma imagem com a ferramenta nativa de imagem da IDE em 16:9, na maior resolução disponível, sem texto e sem marca d'água. Salve exatamente em outputPath, como PNG.
3. Se a ferramenta entregar JPG, WebP ou largura inferior a 1920, mantenha o mesmo nome-base e execute:

       npm run hsl:images:validate -- --queue "<QUEUE.json>" --fix

   Caso contrário, execute o mesmo comando sem --fix. O validador exige PNG, aspecto 16:9 com tolerância de 1% e largura mínima de 1920, atualiza cada item para done ou rejected e imprime a tabela.
4. Para cada item rejected, leia lastError, gere novamente e valide. Faça no máximo duas novas tentativas por item.
5. Quando todos os itens estiverem done, execute literalmente o resumeCommand da fila. Se algum continuar rejected, não retome o grafo; informe os beats e erros ao usuário.

Antigravity e Codex headless não expõem geração nativa de imagem. Execute esta skill na interface da IDE. A ferramenta interativa pode variar o aspecto, limitar a resolução ou devolver JPG/WebP; --fix converte e faz upscale determinístico antes da validação.

Nunca altere prompt.md, gere fora de outputPath, despache Firefly, edite código ou marque manualmente um item como done.
