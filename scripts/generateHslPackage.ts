import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {ThumbnailSeoEngine, EpisodePackagingInput} from '../hsl/packaging/thumbnailSeoEngine';

export async function generatePublicationPackage(input?: Partial<EpisodePackagingInput>) {
  const root = process.cwd();

  const packagingInput: EpisodePackagingInput = {
    episodeId: input?.episodeId || 'HSL_PILOT_001',
    mainTopic: input?.mainTopic || 'The Hidden System That Keeps Planes Flying',
    entity: input?.entity || 'Airport Jet Fuel',
    mechanism: input?.mechanism || 'Pipeline to Hydrant Manifold High-Pressure Injection',
    constraint: input?.constraint || 'Hydrant Pressure Collapse at Node D (72 Units/min)',
    consequence: input?.consequence || '56 Delayed Flights and $2.7M Economic Loss',
    thesis: input?.thesis || 'The visible product is a flight; the hidden product is synchronized fuel logistics.',
    chapters: input?.chapters || [
      { title: 'Before Takeoff: The Invisible Logistics Network', durationSeconds: 10 },
      { title: 'The Reverse Pipeline: From Wing to Refinery', durationSeconds: 10 },
      { title: 'Storage & Capacity Limit: Fuel Farm Headroom', durationSeconds: 10 },
      { title: 'The Hydrant Bottleneck: Pressure Collapse at Node D', durationSeconds: 10 },
      { title: 'Emergency Workarounds & Cascading Delay Costs', durationSeconds: 10 },
      { title: 'System Thesis: The Architecture of Synchronized Power', durationSeconds: 10 }
    ]
  };

  console.log('\n================================================================');
  console.log('📦 HSL PUBLICATION PACKAGING & SEO AGENT (A/B/C TEST ENGINE)');
  console.log(`🎬 Episódio: ${packagingInput.mainTopic}`);
  console.log('================================================================\n');

  const pkg = ThumbnailSeoEngine.generatePackage(packagingInput);

  const outDir = path.resolve(root, 'runs', pkg.episodeId);
  fs.mkdirSync(outDir, {recursive: true});
  const thumbDir = path.resolve(outDir, 'thumbnails');
  fs.mkdirSync(thumbDir, {recursive: true});

  // 1. Salvar JSON estruturado
  const jsonPath = path.resolve(outDir, 'publication-package.json');
  fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2), 'utf8');
  console.log(`✅ Manifesto de publicação salvo em: ${jsonPath}`);

  // 2. Gerar Documento Markdown Formatado para o Creator
  const mdPath = path.resolve(outDir, 'YOUTUBE_PUBLICATION_PACKAGE.md');
  const mdContent = `# 🚀 YOUTUBE PUBLICATION PACKAGE // HIDDEN SYSTEMS LAB
## Episódio: ${pkg.episodeTitle}
**ID do Episódio:** \`${pkg.episodeId}\`  
**Tese Central:** *"${pkg.strategicThesis}"*

---

## 🏷️ 1. TESTE DE TÍTULOS ESTRATÉGICOS (3 OPÇÕES 1+1=3)

| Variante | Tipo / Objetivo | Título Proposto | Fórmula / Gatilho |
| :--- | :--- | :--- | :--- |
| **A** | 🔍 Busca & Intenção SEO | **${pkg.titles[0].title}** | \`${pkg.titles[0].strategicFormula}\` |
| **B** | ⚡ Curiosity Gap (Feed) | **${pkg.titles[1].title}** | \`${pkg.titles[1].strategicFormula}\` |
| **C** | 💥 Contraste / Paradoxo | **${pkg.titles[2].title}** | \`${pkg.titles[2].strategicFormula}\` |

---

## 🎨 2. MATRIZ DE THUMBNAILS PARA TESTE A/B/C (3840x2160 - 4K)

### 🟢 Variante A — Rosto/Sujeito + Prova Concreta (\`${pkg.thumbnails[0].headlineText}\`)
- **Papel:** ${pkg.thumbnails[0].roleName}
- **Headline da Capa:** \`${pkg.thumbnails[0].headlineText}\` (Amarelo Ácido \`${pkg.thumbnails[0].colorAccent}\`)
- **Composição Visual:** ${pkg.thumbnails[0].visualComposition}
- **Direção do Olhar:** ${pkg.thumbnails[0].lookDirection}
- **Prompt IA (35mm / Arri):** \`${pkg.thumbnails[0].imagePrompt}\`

### 🟡 Variante B — Transformação Antes/Depois (\`${pkg.thumbnails[1].headlineText}\`)
- **Papel:** ${pkg.thumbnails[1].roleName}
- **Headline da Capa:** \`${pkg.thumbnails[1].headlineText}\` (Laranja Hiper \`${pkg.thumbnails[1].colorAccent}\`)
- **Composição Visual:** ${pkg.thumbnails[1].visualComposition}
- **Prompt IA:** \`${pkg.thumbnails[1].imagePrompt}\`

### 🔴 Variante C — Objeto Protagonista / Gargalo (\`${pkg.thumbnails[2].headlineText}\`)
- **Papel:** ${pkg.thumbnails[2].roleName}
- **Headline da Capa:** \`${pkg.thumbnails[2].headlineText}\` (Laranja Hiper \`${pkg.thumbnails[2].colorAccent}\`)
- **Composição Visual:** ${pkg.thumbnails[2].visualComposition}
- **Prompt IA:** \`${pkg.thumbnails[2].imagePrompt}\`

---

## 📄 3. DESCRIÇÃO EM CAMADAS (LAYERED DESCRIPTION)

\`\`\`text
${pkg.layeredDescription.fullFormattedText}
\`\`\`

---

## 🔍 4. MAPEAMENTO SEMÂNTICO & TAGS SEO

- **Palavra-Chave Principal:** \`${pkg.primaryKeyword}\`
- **Variações Semânticas:**
${pkg.semanticVariations.map(v => `  - ${v}`).join('\n')}
- **Entidades Técnicas:**
${pkg.technicalEntities.map(e => `  - ${e}`).join('\n')}
- **Perguntas Reais da Audiência:**
${pkg.audienceSearchQueries.map(q => `  - ${q}`).join('\n')}
- **Tags Prontas para Copiar:**
\`\`\`text
${pkg.youtubeTags.join(', ')}
\`\`\`

---
*Gerado automaticamente pelo HSL Packaging & SEO Agent — Hidden Systems Lab.*
`;

  fs.writeFileSync(mdPath, mdContent, 'utf8');
  console.log(`✅ Documento de publicação completo gerado em: ${mdPath}`);

  // 3. Renderizar / Gerar Mockups de Thumbnails em 4K
  for (const t of pkg.thumbnails) {
    const thumbFile = path.resolve(root, t.outputImagePath);
    fs.mkdirSync(path.dirname(thumbFile), {recursive: true});

    // Gerar canvas base em 4K caso não exista imagem
    if (!fs.existsSync(thumbFile)) {
      spawnSync('ffmpeg', [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', `color=c=0x0D0E15:s=3840x2160:d=0.1`,
        '-frames:v', '1',
        thumbFile
      ], {encoding: 'utf8'});
    }
  }

  console.log('\n================================================================');
  console.log('🎉 PACOTE DE PUBLICAÇÃO YOUTUBE CRIADO COM SUCESSO!');
  console.log('================================================================');
  console.log(`📄 Markdown: ${mdPath}`);
  console.log(`📋 JSON: ${jsonPath}`);
  console.log(`🎨 3 Thumbnails A/B/C geradas em: ${thumbDir}`);
  console.log('================================================================\n');

  return pkg;
}

if (require.main === module) {
  generatePublicationPackage().catch(err => {
    console.error('PUBLICATION_PACKAGING_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
