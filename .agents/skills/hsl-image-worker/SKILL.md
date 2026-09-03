---
name: hsl-image-worker
description: >-
  Consome filas QUEUE.json de Start Frames do Hidden Systems Lab usando exclusivamente
  o ImageGen integrado do Codex. Use quando o usuário pedir para gerar imagens do episódio,
  consumir uma fila de imagens ou executar hsl-image-worker.
---

# HSL Image Worker

Trabalhe somente na fila indicada pelo usuário. Se nenhuma for indicada, localize o arquivo QUEUE.json mais recente em runs/*/images por data de modificação.

1. Leia QUEUE.json. Processe, na ordem, cada item com status pending; itens done permanecem intactos.
2. Confirme que `generator` é exatamente `codex-imagegen`. Se estiver ausente ou tiver outro valor, pare e informe o erro; não use outro gerador.
3. Leia o promptPath do item sem alterá-lo. Gere a imagem exclusivamente com o ImageGen integrado do Codex (`image_gen`), em 16:9, na maior resolução disponível, sem texto e sem marca d'água. Copie o arquivo gerado de `$CODEX_HOME/generated_images/` para `outputPath`, como PNG.
4. Se a ferramenta entregar JPG, WebP ou largura inferior a 1920, mantenha o mesmo nome-base e execute:

       npm run hsl:images:validate -- --queue "<QUEUE.json>" --fix

   Caso contrário, execute o mesmo comando sem --fix. O validador exige PNG, aspecto 16:9 com tolerância de 1% e largura mínima de 1920, atualiza cada item para done ou rejected e imprime a tabela.
5. Para cada item rejected, leia lastError, gere novamente e valide. Faça no máximo duas novas tentativas por item.
6. Quando todos os itens estiverem done, execute literalmente o resumeCommand da fila. Se algum continuar rejected, não retome o grafo; informe os beats e erros ao usuário.

Execute esta skill na interface do Codex que expõe `image_gen`. Não use Antigravity, Adobe Firefly, navegador, API/CLI da OpenAI, DALL-E, Midjourney, Stable Diffusion ou qualquer fallback. Se `image_gen` estiver indisponível, pare e informe o usuário. A ferramenta pode variar o aspecto, limitar a resolução ou devolver JPG/WebP; `--fix` converte e faz upscale determinístico antes da validação.

Nunca altere prompt.md, gere fora de outputPath, despache Firefly, edite código ou marque manualmente um item como done.
