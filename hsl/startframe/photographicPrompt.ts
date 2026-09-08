/** Graphics belong to the composition, never to the photographic source. */
export const PHOTOGRAPHIC_CONTRACT_VERSION = 'photographic-v1';
export const PHOTOGRAPHIC_CONSTRAINTS = 'Photorealistic cinematic 35mm documentary photography, physical materials and natural lighting, 16:9. NO TEXT, NO NUMBERS, NO HUD, NO GRAPHICS, NO LOGOS, NO LABELS, NO WATERMARKS, NO TYPOGRAPHY. Overlays are added separately in the composition.';

function positiveClauses(prompt: string): string[] {
  return prompt.split(/[,;\n]/).map(clause => clause.trim())
    .filter(clause => clause && !/^(?:no|without|exclude|avoid|sem|não|nao)\b/i.test(clause));
}
const graphicDirective = /\b(?:typograph\w*|tipograf\w*|infographics?|HUD|(?:text|title|headline|caption)\s+(?:card|overlay)|(?:readable|written|rendered|displayed|visible)\s+(?:text|words|letters)|(?:add|include|write|show|render)\s+(?:the\s+)?(?:text|words|letters|labels|logos))\b/i;

export function assertPhotographicPrompt(prompt: string): void {
  if (!prompt.trim() || positiveClauses(prompt).some(clause => graphicDirective.test(clause))) {
    throw new Error('PHOTOGRAPHIC_PROMPT_REQUIRED: describe the physical subject; text, HUD and typography belong to the composition');
  }
}

export function formatCinematic35mmPrompt(userPrompt: string): string {
  const brief = userPrompt.split(PHOTOGRAPHIC_CONSTRAINTS)[0]
    .replace(/^Cinematic 35mm photograph of\s+/i, '').replace(/[.\s]+$/, '');
  const subject = positiveClauses(brief)
    .filter(clause => !graphicDirective.test(clause) && !/Apple Keynote|Vox high-voltage|Overlays are added separately|Arri Alexa|\b8k\b|documentary aesthetic|^cinematic 35mm (?:pop-)?documentary shot$/i.test(clause))
    .join(', ').replace(/\s*--ar\s+16:9\b/g, '').trim();
  if (!subject) throw new Error('PHOTOGRAPHIC_SUBJECT_REQUIRED: replace the title card with a physical scene');
  return `Cinematic 35mm photograph of ${subject}. ${PHOTOGRAPHIC_CONSTRAINTS} --ar 16:9`;
}
